import { notFound } from 'next/navigation'

import { FormularioRubro } from '@/app/admin/rubros/formulario-rubro'
import { prisma } from '@/lib/prisma'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminRubroEditar({ params }: { params: Promise<{ id: string }> }) {
  await requerirAdmin()
  const { id } = await params
  const rubro = await prisma.rubro.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      nombre: true,
      nombrePlural: true,
      descripcion: true,
      modo: true,
      activo: true,
      orden: true,
      precioExclusivoClp: true,
      precioCompartidoClp: true,
      camposFormulario: true,
      _count: { select: { leads: true } },
    },
  })
  if (!rubro) notFound()

  const { _count, ...datos } = rubro

  return (
    <>
      <h1 className="font-display text-3xl">Editar rubro</h1>
      <p className="mt-2 mb-6 text-sm text-(--color-tinta-suave)">{rubro.nombre}</p>
      <FormularioRubro rubro={datos} leadCount={_count.leads} />
    </>
  )
}
