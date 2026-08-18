'use server'

import { revalidatePath } from 'next/cache'
import {
  EstadoCompraLead,
  EstadoLead,
  EstadoProveedor,
  ModoRubro,
  Prisma,
  TipoCompraLead,
  TipoMovimientoCreditos,
} from '@prisma/client'

import { SELECT_FICHA_ANONIMA } from '@/lib/ficha-anonima'
import {
  esSlugGard,
  faseVentanaGard,
  leadSePuedeVender,
  minutosRestantes,
  puedeTomarLead,
  precioVigente,
  proveedorCubreLead,
  resumenCupos,
  type CompraResumen,
  type LeadMatch,
  type ProveedorMatch,
  type TipoToma,
} from '@/lib/matching'
import { prisma } from '@/lib/prisma'
import { toggleContactadoCompra } from '@/lib/contactado'
import { avisarAdminCompraPagada, avisarCompradorCompraPagada } from '@/server/avisos'
import { saldoProveedor } from '@/server/creditos'
import { ensureGardSecurity } from '@/server/gard'
import { requerirProveedor } from '@/server/sesion'

export type ResultadoToma = { ok: boolean; mensaje: string }

export type ContactoRevelado = {
  nombreContacto: string
  email: string
  telefonoE164: string
  rutNormalizado: string
  razonSocial: string | null
}

export type LeadPanelDisponible = {
  id: string
  rubro: string
  rubroSlug: string
  comuna: string
  region: string
  verificadoAt: Date
  rutValido: boolean
  telefonoVerificado: boolean
  precioExclusivo: number | null
  precioCompartido: number | null
  precioBaseExclusivo: number | null
  precioBaseCompartido: number | null
  cuposRestantes: number
  puedeExclusivo: boolean
  puedeCompartido: boolean
  reservadoGard: boolean
  disponibleEnMin: number
}

export type LeadPanelTomado = LeadPanelDisponible & {
  compraId: string
  tipo: TipoToma
  precioClp: number
  compradoAt: Date
  contactadoEn: Date | null
  contacto: ContactoRevelado
}

export type MovimientoPanel = {
  id: string
  createdAt: Date
  tipo: TipoMovimientoCreditos
  montoCreditos: number
  saldoPosterior: number
  descripcion: string | null
}

export type PanelProveedorVacio = {
  proveedor: null
  saldo: 0
  disponibles: LeadPanelDisponible[]
  tomados: LeadPanelTomado[]
  movimientos: MovimientoPanel[]
  gastoMesClp: 0
  comprasMes: 0
  contactadosMes: 0
}

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

const SELECT_GARD = {
  estado: true,
  coberturaNacional: true,
  slug: true,
  solicitudEspera: true,
  coberturas: {
    where: { activa: true },
    select: { activa: true, rubro: { select: { slug: true } }, comuna: { select: { slug: true } } },
  },
} as const

async function gardsAprobados(db: typeof prisma | Prisma.TransactionClient) {
  return db.proveedor.findMany({
    where: {
      estado: EstadoProveedor.APROBADO,
      OR: [{ slug: 'gard-security' }, { slug: { startsWith: 'gard' } }],
    },
    select: SELECT_GARD,
  })
}

function hayGardQueCalza(gards: Awaited<ReturnType<typeof gardsAprobados>>, lead: LeadMatch): boolean {
  if (lead.rubroSlug !== 'seguridad') return false
  return gards.some((gard) => proveedorCubreLead(aProveedorMatch(gard), lead) && esSlugGard(gard.slug))
}

export async function cargarPanelProveedor(usuarioId: string) {
  await ensureGardSecurity()

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId },
    select: {
      id: true,
      slug: true,
      nombre: true,
      estado: true,
      coberturaNacional: true,
      solicitudEspera: true,
      coberturas: {
        select: { activa: true, rubro: { select: { slug: true } }, comuna: { select: { slug: true } } },
      },
    },
  })

  if (!proveedor) {
    return {
      proveedor: null,
      saldo: 0,
      disponibles: [] as LeadPanelDisponible[],
      tomados: [] as LeadPanelTomado[],
      movimientos: [] as MovimientoPanel[],
      gastoMesClp: 0,
      comprasMes: 0,
      contactadosMes: 0,
    } satisfies PanelProveedorVacio
  }

  const saldo = await saldoProveedor(proveedor.id)
  const matchProv = aProveedorMatch(proveedor)
  const ahora = new Date()
  const desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [candidatos, comprasPropias, gards, movimientosDb, agregadosMes] = await Promise.all([
    prisma.lead.findMany({
      where: {
        estado: EstadoLead.VERIFICADO,
        modoRubroAlCrear: ModoRubro.VENTA,
        rutValido: true,
        telefonoVerificado: true,
        verificadoAt: { gte: desde },
      },
      select: {
        ...SELECT_FICHA_ANONIMA,
        compras: {
          where: { estado: EstadoCompraLead.PAGADA },
          select: { tipo: true, estado: true, proveedorId: true },
        },
      },
      orderBy: { verificadoAt: 'desc' },
      take: 80,
    }),
    prisma.compraLead.findMany({
      where: { proveedorId: proveedor.id, estado: EstadoCompraLead.PAGADA },
      select: {
        id: true,
        tipo: true,
        precioClp: true,
        createdAt: true,
        contactadoEn: true,
        lead: {
          select: {
            ...SELECT_FICHA_ANONIMA,
            contacto: {
              select: {
                nombreContacto: true,
                email: true,
                telefonoE164: true,
                rutNormalizado: true,
                razonSocial: true,
              },
            },
            compras: {
              where: { estado: EstadoCompraLead.PAGADA },
              select: { tipo: true, estado: true, proveedorId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    gardsAprobados(prisma),
    prisma.movimientoCreditos.findMany({
      where: { proveedorId: proveedor.id },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        createdAt: true,
        tipo: true,
        montoCreditos: true,
        saldoPosterior: true,
        descripcion: true,
      },
    }),
    Promise.all([
      prisma.movimientoCreditos.aggregate({
        where: {
          proveedorId: proveedor.id,
          tipo: TipoMovimientoCreditos.CONSUMO_LEAD,
          montoCreditos: { lt: 0 },
          createdAt: { gte: inicioMes },
        },
        _sum: { montoCreditos: true },
      }),
      prisma.compraLead.count({
        where: {
          proveedorId: proveedor.id,
          estado: EstadoCompraLead.PAGADA,
          createdAt: { gte: inicioMes },
        },
      }),
      prisma.compraLead.count({
        where: {
          proveedorId: proveedor.id,
          estado: EstadoCompraLead.PAGADA,
          createdAt: { gte: inicioMes },
          contactadoEn: { not: null },
        },
      }),
    ]),
  ])

  const idsPropios = new Set(comprasPropias.map((compra) => compra.lead.id))
  const disponibles: LeadPanelDisponible[] = []

  for (const lead of candidatos) {
    if (idsPropios.has(lead.id)) continue
    const matchLead = aLeadMatch(lead)
    if (!leadSePuedeVender(matchLead, ahora)) continue
    if (!proveedorCubreLead(matchProv, matchLead)) continue
    const compras: CompraResumen[] = lead.compras
    const cupos = resumenCupos(compras)
    if (!cupos.puedeExclusivo && !cupos.puedeCompartido) continue
    const hayGard = hayGardQueCalza(gards, matchLead)
    const gard = faseVentanaGard({
      rubroSlug: matchLead.rubroSlug,
      verificadoAt: matchLead.verificadoAt,
      hayGardQueCalza: hayGard,
      slugProveedor: proveedor.slug,
      ahora,
    })
    disponibles.push({
      id: lead.id,
      rubro: lead.rubro.nombre,
      rubroSlug: lead.rubro.slug,
      comuna: lead.comuna.nombre,
      region: lead.comuna.region,
      verificadoAt: lead.verificadoAt ?? lead.createdAt,
      rutValido: lead.rutValido,
      telefonoVerificado: lead.telefonoVerificado,
      precioExclusivo: precioVigente(lead.rubro.precioExclusivoClp, lead.verificadoAt, ahora),
      precioCompartido: precioVigente(lead.rubro.precioCompartidoClp, lead.verificadoAt, ahora),
      precioBaseExclusivo: lead.rubro.precioExclusivoClp,
      precioBaseCompartido: lead.rubro.precioCompartidoClp,
      cuposRestantes: cupos.cuposCompartidoRestantes,
      puedeExclusivo: cupos.puedeExclusivo && Boolean(precioVigente(lead.rubro.precioExclusivoClp, lead.verificadoAt, ahora)),
      puedeCompartido:
        cupos.puedeCompartido && Boolean(precioVigente(lead.rubro.precioCompartidoClp, lead.verificadoAt, ahora)),
      reservadoGard: gard.fase === 'reservado',
      disponibleEnMin: gard.fase === 'reservado' ? minutosRestantes(gard.restanteMs) : 0,
    })
  }

  const tomados: LeadPanelTomado[] = comprasPropias.flatMap((compra) => {
    const lead = compra.lead
    if (!lead.contacto) return []
    const ahoraLocal = new Date()
    const compras: CompraResumen[] = lead.compras
    const cupos = resumenCupos(compras)
    return [
      {
        id: lead.id,
        compraId: compra.id,
        rubro: lead.rubro.nombre,
        rubroSlug: lead.rubro.slug,
        comuna: lead.comuna.nombre,
        region: lead.comuna.region,
        verificadoAt: lead.verificadoAt ?? lead.createdAt,
        rutValido: lead.rutValido,
        telefonoVerificado: lead.telefonoVerificado,
        precioExclusivo: precioVigente(lead.rubro.precioExclusivoClp, lead.verificadoAt, ahoraLocal),
        precioCompartido: precioVigente(lead.rubro.precioCompartidoClp, lead.verificadoAt, ahoraLocal),
        precioBaseExclusivo: lead.rubro.precioExclusivoClp,
        precioBaseCompartido: lead.rubro.precioCompartidoClp,
        cuposRestantes: cupos.cuposCompartidoRestantes,
        puedeExclusivo: false,
        puedeCompartido: false,
        reservadoGard: false,
        disponibleEnMin: 0,
        tipo: compra.tipo,
        precioClp: compra.precioClp,
        compradoAt: compra.createdAt,
        contactadoEn: compra.contactadoEn,
        contacto: lead.contacto,
      },
    ]
  })

  const [gastoAgg, comprasMes, contactadosMes] = agregadosMes
  const gastoMesClp = Math.abs(gastoAgg._sum.montoCreditos ?? 0)

  return {
    proveedor,
    saldo,
    disponibles,
    tomados,
    movimientos: movimientosDb,
    gastoMesClp,
    comprasMes,
    contactadosMes,
  }
}

/**
 * Toggle de «ya contacté». Ownership en servidor; error genérico si la compra
 * no existe o es de otro proveedor.
 */
export async function marcarContactadoAction(
  _previo: ResultadoToma,
  formData: FormData,
): Promise<ResultadoToma> {
  const sesion = await requerirProveedor()
  const compraId = String(formData.get('compraId') ?? '')
  if (!compraId) return { ok: false, mensaje: 'Falta la compra.' }

  const proveedor = await prisma.proveedor.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { id: true },
  })
  if (!proveedor) return { ok: false, mensaje: 'No encontramos esa compra.' }

  const resultado = await toggleContactadoCompra(prisma, {
    compraId,
    proveedorId: proveedor.id,
  })
  if (!resultado.ok) return { ok: false, mensaje: resultado.mensaje }

  revalidatePath('/panel')
  return {
    ok: true,
    mensaje: resultado.contactadoEn ? 'Marcado como contactado.' : 'Quedó sin contactar.',
  }
}

export async function tomarLeadAction(
  _previo: ResultadoToma,
  formData: FormData,
): Promise<ResultadoToma> {
  const sesion = await requerirProveedor()
  const leadId = String(formData.get('leadId') ?? '')
  const tipoBruto = String(formData.get('tipo') ?? '')
  const tipo: TipoToma | null = tipoBruto === 'EXCLUSIVO' || tipoBruto === 'COMPARTIDO' ? tipoBruto : null
  if (!leadId || !tipo) return { ok: false, mensaje: 'Falta el tipo de toma.' }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        const proveedor = await tx.proveedor.findUnique({
          where: { usuarioId: sesion.user.id },
          select: {
            id: true,
            slug: true,
            estado: true,
            coberturaNacional: true,
            solicitudEspera: true,
            coberturas: {
              select: { activa: true, rubro: { select: { slug: true } }, comuna: { select: { slug: true } } },
            },
          },
        })
        if (!proveedor || proveedor.estado !== EstadoProveedor.APROBADO) {
          throw new Error('Tu cuenta todavía no puede tomar compradores.')
        }

        const lead = await tx.lead.findUnique({
          where: { id: leadId },
          select: {
            ...SELECT_FICHA_ANONIMA,
            compras: {
              where: { estado: EstadoCompraLead.PAGADA },
              select: { tipo: true, estado: true, proveedorId: true },
            },
          },
        })
        if (!lead) throw new Error('No encontramos ese comprador.')

        const yaMio = lead.compras.some((compra) => compra.proveedorId === proveedor.id)
        if (yaMio) return { mensaje: 'Este contacto ya es tuyo.' }

        const ahora = new Date()
        const matchLead = aLeadMatch(lead)
        const matchProv = aProveedorMatch(proveedor)
        const hayGard = hayGardQueCalza(await gardsAprobados(tx), matchLead)
        const precioBase =
          tipo === 'EXCLUSIVO' ? lead.rubro.precioExclusivoClp : lead.rubro.precioCompartidoClp
        const precio = precioVigente(precioBase, lead.verificadoAt, ahora)
        const saldo = await saldoProveedor(proveedor.id, tx)

        const decision = puedeTomarLead({
          proveedor: matchProv,
          lead: matchLead,
          tipo,
          compras: lead.compras,
          saldo,
          precioClp: precio,
          hayGardQueCalza: hayGard,
          ahora,
        })
        if (!decision.ok) throw new Error(decision.motivo)
        if (!precio) throw new Error('Este servicio no tiene precio de venta.')

        const compra = await tx.compraLead.create({
          data: {
            leadId: lead.id,
            proveedorId: proveedor.id,
            tipo: tipo === 'EXCLUSIVO' ? TipoCompraLead.EXCLUSIVO : TipoCompraLead.COMPARTIDO,
            precioClp: precio,
            creditosConsumidos: precio,
            estado: EstadoCompraLead.PAGADA,
            contactoReveladoAt: ahora,
          },
          select: { id: true },
        })

        await tx.movimientoCreditos.create({
          data: {
            proveedorId: proveedor.id,
            tipo: TipoMovimientoCreditos.CONSUMO_LEAD,
            montoCreditos: -precio,
            saldoPosterior: saldo - precio,
            compraLeadId: compra.id,
            descripcion: `Contacto ${tipo === 'EXCLUSIVO' ? 'exclusivo' : 'compartido'}`,
          },
        })

        return {
          mensaje: 'Ya es tuyo. Ahí está el contacto.',
          compraId: compra.id,
          leadId: lead.id,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    if (resultado.compraId && resultado.leadId) {
      await avisarCompradorCompraPagada({
        leadId: resultado.leadId,
        compraId: resultado.compraId,
      })
      await avisarAdminCompraPagada({
        leadId: resultado.leadId,
        compraId: resultado.compraId,
      })
    }

    revalidatePath('/panel')
    return { ok: true, mensaje: resultado.mensaje }
  } catch (error) {
    const texto = error instanceof Error ? error.message : 'No se pudo tomar.'
    return { ok: false, mensaje: texto }
  }
}

export async function proveedorDelUsuario(usuarioId: string) {
  return prisma.proveedor.findUnique({
    where: { usuarioId },
    select: { id: true, estado: true, slug: true, nombre: true },
  })
}
