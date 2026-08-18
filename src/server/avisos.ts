import { EstadoCompraLead, EstadoProveedor } from '@prisma/client'

import {
  claveIdempotenciaAvisoLead,
  claveIdempotenciaCompraComprador,
  correoAvisoCompra,
  correoAvisoLead,
  correoProveedor,
  enviarCorreo,
  proveedoresAAvisar,
} from '@/lib/email'
import { SELECT_FICHA_ANONIMA } from '@/lib/ficha-anonima'
import {
  leadSePuedeVender,
  precioVigente,
  type LeadMatch,
  type ProveedorMatch,
} from '@/lib/matching'
import { prisma } from '@/lib/prisma'

function leadMatchDesdeFicha(lead: {
  estado: string
  modoRubroAlCrear: string
  rutValido: boolean
  telefonoVerificado: boolean
  verificadoAt: Date | null
  rubro: { slug: string }
  comuna: { slug: string; region: string; provincia: string }
}): LeadMatch {
  return {
    rubroSlug: lead.rubro.slug,
    comunaSlug: lead.comuna.slug,
    region: lead.comuna.region,
    provincia: lead.comuna.provincia,
    estado: lead.estado,
    modoRubroAlCrear: lead.modoRubroAlCrear,
    rutValido: lead.rutValido,
    telefonoVerificado: lead.telefonoVerificado,
    verificadoAt: lead.verificadoAt,
  }
}

function proveedorMatchDesdeFila(proveedor: {
  estado: string
  coberturaNacional: boolean
  slug: string
  solicitudEspera: unknown
  coberturas: Array<{ activa: boolean; rubro: { slug: string }; comuna: { slug: string } }>
}): ProveedorMatch {
  return {
    estado: proveedor.estado,
    coberturaNacional: proveedor.coberturaNacional,
    slug: proveedor.slug,
    solicitudEspera: proveedor.solicitudEspera,
    coberturas: proveedor.coberturas.map((fila) => ({
      activa: fila.activa,
      rubroSlug: fila.rubro.slug,
      comunaSlug: fila.comuna.slug,
    })),
  }
}

/** Tras commit. Nunca lanza: un fallo de correo no bloquea el lead. */
export async function avisarProveedoresLeadVerificado(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: SELECT_FICHA_ANONIMA,
    })
    if (!lead) return

    const match = leadMatchDesdeFicha(lead)
    if (!leadSePuedeVender(match)) return

    const proveedores = await prisma.proveedor.findMany({
      where: { estado: EstadoProveedor.APROBADO },
      select: {
        id: true,
        email: true,
        slug: true,
        estado: true,
        coberturaNacional: true,
        solicitudEspera: true,
        usuario: { select: { email: true } },
        coberturas: {
          where: { activa: true },
          select: {
            activa: true,
            rubro: { select: { slug: true } },
            comuna: { select: { slug: true } },
          },
        },
      },
    })

    const ahora = new Date()
    const ficha = {
      rubro: lead.rubro.nombre,
      comuna: lead.comuna.nombre,
      precioExclusivoClp: precioVigente(lead.rubro.precioExclusivoClp, lead.verificadoAt, ahora),
      precioCompartidoClp: precioVigente(lead.rubro.precioCompartidoClp, lead.verificadoAt, ahora),
    }
    const cuerpo = correoAvisoLead(ficha)
    const destinos = proveedoresAAvisar(
      match,
      proveedores.map((proveedor) => ({
        ...proveedorMatchDesdeFila(proveedor),
        id: proveedor.id,
        email: correoProveedor(proveedor),
      })),
    )

    await Promise.all(
      destinos.map((destino) =>
        enviarCorreo({
          to: destino.email,
          subject: cuerpo.subject,
          html: cuerpo.html,
          text: cuerpo.text,
          idempotencyKey: claveIdempotenciaAvisoLead(leadId, destino.id),
        }),
      ),
    )
  } catch (error) {
    console.error('[email] aviso a proveedores', error)
  }
}

/** Tras CompraLead PAGADA. Nunca lanza. Sin nombre del proveedor. */
export async function avisarCompradorCompraPagada(args: {
  leadId: string
  compraId: string
}): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: args.leadId },
      select: {
        rubro: { select: { nombre: true } },
        comuna: { select: { nombre: true } },
        contacto: { select: { email: true } },
        compras: {
          where: { id: args.compraId, estado: EstadoCompraLead.PAGADA },
          select: { id: true },
        },
      },
    })

    const email = lead?.contacto?.email
    if (!lead || !email || lead.compras.length === 0) return

    const cuerpo = correoAvisoCompra({ rubro: lead.rubro.nombre, comuna: lead.comuna.nombre })
    await enviarCorreo({
      to: email,
      subject: cuerpo.subject,
      html: cuerpo.html,
      text: cuerpo.text,
      idempotencyKey: claveIdempotenciaCompraComprador(args.compraId),
    })
  } catch (error) {
    console.error('[email] aviso al comprador', error)
  }
}
