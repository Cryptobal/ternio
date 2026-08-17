import { FormularioLoginAdmin } from '@/app/admin/ingresar/formulario'

export const dynamic = 'force-dynamic'

export default function IngresarAdmin() {
  return (
    <div className="mx-auto w-full max-w-sm py-10">
      <h1 className="text-xl font-semibold">Ingresar</h1>
      <FormularioLoginAdmin />
    </div>
  )
}
