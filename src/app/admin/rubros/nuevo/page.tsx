import { FormularioRubro } from '@/app/admin/rubros/formulario-rubro'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminRubroNuevo() {
  await requerirAdmin()
  return (
    <>
      <h1 className="font-display text-3xl">Nuevo rubro</h1>
      <p className="mt-2 mb-6 text-sm text-(--color-tinta-suave)">
        CAPTURA junta demanda. VENTA pide ambos precios y entra al cotizador.
      </p>
      <FormularioRubro />
    </>
  )
}
