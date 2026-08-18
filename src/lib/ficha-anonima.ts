import type { Prisma } from '@prisma/client'

/**
 * Selects obligatorios para cualquier lectura de leads que pueda llegar a un
 * proveedor. El contacto (LeadContacto) queda fuera por construcción: se
 * revela solo tras una CompraLead pagada, y esa revelación se resuelve en su
 * propio módulo (F3), nunca ampliando este select.
 *
 * Regla: si escribes una query de leads de cara a proveedores y no usas
 * SELECT_FICHA_ANONIMA, la estás escribiendo mal.
 */
export const SELECT_FICHA_ANONIMA = {
  id: true,
  estado: true,
  score: true,
  datos: true,
  rutValido: true,
  telefonoVerificado: true,
  createdAt: true,
  verificadoAt: true,
  modoRubroAlCrear: true,
  rubro: {
    select: {
      slug: true,
      nombre: true,
      modo: true,
      precioExclusivoClp: true,
      precioCompartidoClp: true,
      precioExclusivoHogarClp: true,
      precioCompartidoHogarClp: true,
    },
  },
  comuna: { select: { slug: true, nombre: true, region: true, provincia: true } },
  audiencia: true,
} satisfies Prisma.LeadSelect

export type FichaAnonimaLead = Prisma.LeadGetPayload<{
  select: typeof SELECT_FICHA_ANONIMA
}>

/**
 * Etiquetas de verificación que sí ve el proveedor en la ficha anónima.
 */
export function etiquetasVerificacion(lead: {
  rutValido: boolean
  telefonoVerificado: boolean
}): string[] {
  const etiquetas: string[] = []
  if (lead.rutValido) etiquetas.push('RUT validado')
  if (lead.telefonoVerificado) etiquetas.push('Teléfono verificado')
  return etiquetas
}
