import { EstadoCompraLead, EstadoProveedor, TipoEventoAnalitica } from '@prisma/client'

import {
  claveIdempotenciaAdminCompra,
  claveIdempotenciaAdminLead,
  claveIdempotenciaAdminProveedorAlta,
  claveIdempotenciaAvisoLead,
  claveIdempotenciaCompraComprador,
  correoAdminAltaProveedor,
  correoAdminCompra,
  correoAdminLeadCreado,
  correoAdminLeadVerificado,
  correoAvisoCompra,
  correoAvisoLead,
  correoProveedor,
  emailAdminAvisos,
  enviarCorreo,
  omitirAvisoAltaProveedor,
  proveedoresAAvisar,
  type EnvioCorreo,
  type FichaAdminCompra,
  type FichaAdminLead,
  type FichaAdminProveedor,
  type ResultadoCorreo,
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
      select: {
        ...SELECT_FICHA_ANONIMA,
        rubroId: true,
        comunaId: true,
      },
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

    // Después del despacho, fail-soft: medir SLA sin retrasar ni tumbar el aviso.
    // Import dinámico: evita arrastrar `server-only` al grafo de tests de avisos admin.
    try {
      const msDesdeVerificado = lead.verificadoAt
        ? Math.max(0, Date.now() - lead.verificadoAt.getTime())
        : 0
      const { registrarEvento } = await import('@/lib/analitica')
      await registrarEvento({
        tipo: TipoEventoAnalitica.LEAD_AVISADO,
        leadId,
        rubroId: lead.rubroId,
        comunaId: lead.comunaId,
        metadata: {
          proveedoresAvisados: destinos.length,
          msDesdeVerificado,
        },
      })
    } catch (error) {
      console.error('[analitica] LEAD_AVISADO', error)
    }
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

type EnviarAviso = (envio: EnvioCorreo) => Promise<ResultadoCorreo>

type DepsAvisoAdmin = {
  enviar?: EnviarAviso
  destinatario?: string
}

function destinoAdmin(deps?: DepsAvisoAdmin): string {
  return deps?.destinatario ?? emailAdminAvisos()
}

function clienteEnvio(deps?: DepsAvisoAdmin): EnviarAviso {
  return deps?.enviar ?? enviarCorreo
}

async function cargarFichaAdminLead(leadId: string): Promise<FichaAdminLead | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      estado: true,
      audiencia: true,
      rubro: { select: { nombre: true } },
      comuna: { select: { nombre: true } },
      contacto: {
        select: {
          nombreContacto: true,
          email: true,
          telefonoE164: true,
          rutNormalizado: true,
          razonSocial: true,
        },
      },
    },
  })
  if (!lead?.contacto) return null
  return {
    rubro: lead.rubro.nombre,
    comuna: lead.comuna.nombre,
    estado: lead.estado,
    audiencia: lead.audiencia,
    nombreContacto: lead.contacto.nombreContacto,
    email: lead.contacto.email,
    telefonoE164: lead.contacto.telefonoE164,
    rutNormalizado: lead.contacto.rutNormalizado,
    razonSocial: lead.contacto.razonSocial,
  }
}

async function cargarFichaAdminProveedor(proveedorId: string): Promise<FichaAdminProveedor | null> {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: {
      slug: true,
      nombre: true,
      razonSocial: true,
      rutNormalizado: true,
      email: true,
      telefonoE164: true,
    },
  })
  if (!proveedor) return null
  return proveedor
}

/** Tras crear el lead. Un correo, con el estado real (pendiente o ya VERIFICADO). Nunca lanza. */
export async function avisarAdminLeadCreado(
  leadId: string,
  deps?: DepsAvisoAdmin & { cargarLead?: (id: string) => Promise<FichaAdminLead | null> },
): Promise<void> {
  try {
    const ficha = await (deps?.cargarLead ?? cargarFichaAdminLead)(leadId)
    if (!ficha) return
    const cuerpo = correoAdminLeadCreado(ficha)
    await clienteEnvio(deps)({
      to: destinoAdmin(deps),
      subject: cuerpo.subject,
      html: cuerpo.html,
      text: cuerpo.text,
      idempotencyKey: claveIdempotenciaAdminLead(leadId, ficha.estado),
    })
  } catch (error) {
    console.error('[email] aviso admin lead creado', error)
  }
}

/** Si el OTP (u otro camino) pasa a VERIFICADO después de un create pendiente. Nunca lanza. */
export async function avisarAdminLeadVerificado(
  leadId: string,
  deps?: DepsAvisoAdmin & { cargarLead?: (id: string) => Promise<FichaAdminLead | null> },
): Promise<void> {
  try {
    const ficha = await (deps?.cargarLead ?? cargarFichaAdminLead)(leadId)
    if (!ficha) return
    const cuerpo = correoAdminLeadVerificado(ficha)
    await clienteEnvio(deps)({
      to: destinoAdmin(deps),
      subject: cuerpo.subject,
      html: cuerpo.html,
      text: cuerpo.text,
      idempotencyKey: claveIdempotenciaAdminLead(leadId, 'VERIFICADO'),
    })
  } catch (error) {
    console.error('[email] aviso admin lead verificado', error)
  }
}

/** Alta real: cuenta APROBADA tras OTP + RUT. Omite Gard. Nunca lanza. */
export async function avisarAdminAltaProveedor(
  proveedorId: string,
  deps?: DepsAvisoAdmin & {
    cargarProveedor?: (id: string) => Promise<FichaAdminProveedor | null>
  },
): Promise<void> {
  try {
    const ficha = await (deps?.cargarProveedor ?? cargarFichaAdminProveedor)(proveedorId)
    if (!ficha || omitirAvisoAltaProveedor(ficha.slug)) return
    const cuerpo = correoAdminAltaProveedor(ficha)
    await clienteEnvio(deps)({
      to: destinoAdmin(deps),
      subject: cuerpo.subject,
      html: cuerpo.html,
      text: cuerpo.text,
      idempotencyKey: claveIdempotenciaAdminProveedorAlta(proveedorId),
    })
  } catch (error) {
    console.error('[email] aviso admin alta proveedor', error)
  }
}

async function cargarFichaAdminCompra(args: {
  leadId: string
  compraId: string
}): Promise<FichaAdminCompra | null> {
  const compra = await prisma.compraLead.findFirst({
    where: { id: args.compraId, leadId: args.leadId, estado: EstadoCompraLead.PAGADA },
    select: {
      tipo: true,
      precioClp: true,
      creditosConsumidos: true,
      lead: {
        select: {
          rubro: { select: { nombre: true } },
          comuna: { select: { nombre: true } },
        },
      },
      proveedor: { select: { nombre: true, razonSocial: true, slug: true } },
    },
  })
  if (!compra) return null
  return {
    rubro: compra.lead.rubro.nombre,
    comuna: compra.lead.comuna.nombre,
    tipo: compra.tipo,
    precioClp: compra.precioClp,
    creditosConsumidos: compra.creditosConsumidos,
    proveedorNombre:
      compra.proveedor.razonSocial?.trim() || compra.proveedor.nombre.trim() || compra.proveedor.slug,
  }
}

/** Tras CompraLead PAGADA. Incluye nombre del proveedor. Nunca lanza. */
export async function avisarAdminCompraPagada(
  args: { leadId: string; compraId: string },
  deps?: DepsAvisoAdmin & {
    cargarCompra?: (entrada: { leadId: string; compraId: string }) => Promise<FichaAdminCompra | null>
  },
): Promise<void> {
  try {
    const ficha = await (deps?.cargarCompra ?? cargarFichaAdminCompra)(args)
    if (!ficha) return
    const cuerpo = correoAdminCompra(ficha)
    await clienteEnvio(deps)({
      to: destinoAdmin(deps),
      subject: cuerpo.subject,
      html: cuerpo.html,
      text: cuerpo.text,
      idempotencyKey: claveIdempotenciaAdminCompra(args.compraId),
    })
  } catch (error) {
    console.error('[email] aviso admin compra', error)
  }
}
