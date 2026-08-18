import 'server-only'

import { EstadoCompraLead, EstadoProveedor, TipoEventoAnalitica } from '@prisma/client'

import { reservarAvisoEmail } from '@/lib/analitica'
import {
  asuntoLeadAVenta,
  asuntoLeadTomado,
  claveAvisoLeadTomado,
  claveAvisoLeadVenta,
  cuerpoLeadAVenta,
  cuerpoLeadTomado,
  proveedoresAAvisar,
  urlPublicaSitio,
} from '@/lib/email-avisos'
import { enviarEmail } from '@/lib/email'
import { SELECT_FICHA_ANONIMA } from '@/lib/ficha-anonima'
import { type LeadMatch, type ProveedorMatch } from '@/lib/matching'
import { prisma } from '@/lib/prisma'

function aLeadMatch(lead: {
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

function aProveedorMatch(proveedor: {
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

function correoProveedor(proveedor: { email: string | null; usuario: { email: string | null } | null }): string | null {
  const directo = proveedor.email?.trim()
  if (directo) return directo
  const deUsuario = proveedor.usuario?.email?.trim()
  return deUsuario || null
}

/** Tras commit. Nunca lanza. */
export async function avisarLeadAVenta(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { ...SELECT_FICHA_ANONIMA, rubroId: true, comunaId: true },
    })
    if (!lead) return

    const matchLead = aLeadMatch(lead)
    const proveedores = await prisma.proveedor.findMany({
      where: { estado: EstadoProveedor.APROBADO },
      select: {
        id: true,
        slug: true,
        email: true,
        estado: true,
        coberturaNacional: true,
        solicitudEspera: true,
        usuarioId: true,
        usuario: { select: { email: true } },
        coberturas: {
          where: { activa: true },
          select: { activa: true, rubro: { select: { slug: true } }, comuna: { select: { slug: true } } },
        },
      },
    })

    const calzan = proveedoresAAvisar(
      matchLead,
      proveedores.map((proveedor) => ({ ...aProveedorMatch(proveedor), id: proveedor.id })),
    )
    const porId = new Map(proveedores.map((proveedor) => [proveedor.id, proveedor]))
    const asunto = asuntoLeadAVenta(lead.rubro.nombre, lead.comuna.nombre)
    const cuerpo = cuerpoLeadAVenta({
      rubro: lead.rubro.nombre,
      comuna: lead.comuna.nombre,
      precioExclusivoClp: lead.rubro.precioExclusivoClp,
      precioCompartidoClp: lead.rubro.precioCompartidoClp,
      urlPanel: `${urlPublicaSitio()}/panel`,
    })

    for (const calce of calzan) {
      const proveedor = porId.get(calce.id)
      if (!proveedor) continue
      const para = correoProveedor(proveedor)
      if (!para) continue
      const key = claveAvisoLeadVenta(lead.id, proveedor.id)
      const reserva = await reservarAvisoEmail({
        tipo: TipoEventoAnalitica.AVISO_LEAD_A_VENTA,
        leadId: lead.id,
        rubroId: lead.rubroId,
        comunaId: lead.comunaId,
        usuarioId: proveedor.usuarioId,
        path: '/panel',
        idempotencyKey: key,
        metadata: { proveedorId: proveedor.id },
      })
      if (reserva !== 'creado') continue
      await enviarEmail({
        to: para,
        subject: asunto,
        text: cuerpo,
        idempotencyKey: key,
      })
    }
  } catch (error) {
    console.error('[email] aviso lead a venta', {
      leadId,
      error: error instanceof Error ? error.message : 'desconocido',
    })
  }
}

/** Tras CompraLead PAGADA. Nunca lanza. Sin nombre del proveedor. */
export async function avisarLeadTomado(leadId: string, compraId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        rubro: { select: { nombre: true } },
        comuna: { select: { nombre: true } },
        contacto: { select: { email: true } },
        compras: {
          where: { id: compraId, estado: EstadoCompraLead.PAGADA },
          select: { id: true },
        },
      },
    })
    if (!lead || lead.compras.length === 0) return
    const para = lead.contacto?.email?.trim()
    if (!para) return

    const key = claveAvisoLeadTomado(compraId)
    const reserva = await reservarAvisoEmail({
      tipo: TipoEventoAnalitica.AVISO_LEAD_TOMADO,
      leadId,
      path: '/mis-cotizaciones',
      idempotencyKey: key,
      metadata: { compraId },
    })
    if (reserva !== 'creado') return

    await enviarEmail({
      to: para,
      subject: asuntoLeadTomado(),
      text: cuerpoLeadTomado({
        rubro: lead.rubro.nombre,
        comuna: lead.comuna.nombre,
        urlCotizaciones: `${urlPublicaSitio()}/mis-cotizaciones`,
      }),
      idempotencyKey: key,
    })
  } catch (error) {
    console.error('[email] aviso lead tomado', {
      leadId,
      compraId,
      error: error instanceof Error ? error.message : 'desconocido',
    })
  }
}
