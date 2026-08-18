import { redirect } from 'next/navigation'

import { rutaAdmin } from '@/lib/admin-ruta'
import { requerirAdmin } from '@/server/sesion'

export const dynamic = 'force-dynamic'

export default async function AdminLeadsIndex() {
  await requerirAdmin()
  redirect(rutaAdmin('compradores'))
}
