import 'server-only'

import { cargarTraficoGa4, type TraficoGa4 } from '@/lib/ga4'

/** Solo servidor / admin. El JSON de la service account no sale al cliente. */
export async function cargarTraficoGa4Admin(): Promise<TraficoGa4> {
  return cargarTraficoGa4()
}
