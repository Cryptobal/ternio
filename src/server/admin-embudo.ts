'use server'

import { revalidatePath } from 'next/cache'

import { rutaAdmin } from '@/lib/admin-ruta'
import {
  claveInversionAds,
  parsearInversionClp,
  parsearRango,
  type RangoEmbudo,
} from '@/lib/metricas-calculo'
import { prisma } from '@/lib/prisma'
import { requerirAdmin } from '@/server/sesion'

export type EstadoInversionAds = {
  ok: boolean
  mensaje?: string
}

export async function guardarInversionAdsAction(
  _previo: EstadoInversionAds,
  formData: FormData,
): Promise<EstadoInversionAds> {
  await requerirAdmin()

  const rango = parsearRango(String(formData.get('rango') ?? ''))
  const bruto = String(formData.get('inversionClp') ?? '')
  const inversionClp = parsearInversionClp(bruto)

  if (bruto.trim() !== '' && !/^\d[\d.\s]*$/.test(bruto.trim()) && Number.isNaN(Number(bruto))) {
    return { ok: false, mensaje: 'La inversión tiene que ser un número en CLP.' }
  }

  await prisma.parametroAdmin.upsert({
    where: { clave: claveInversionAds(rango) },
    create: { clave: claveInversionAds(rango), valor: String(inversionClp) },
    update: { valor: String(inversionClp) },
  })

  revalidatePath(rutaAdmin('embudo'))
  return { ok: true, mensaje: 'Inversión guardada para este rango.' }
}

export type { RangoEmbudo }
