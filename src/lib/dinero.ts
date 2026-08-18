const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatearClp(monto: number): string {
  return clp.format(monto)
}

export function textoAntiguedad(desde: Date, ahora = new Date()): string {
  const ms = Math.max(0, ahora.getTime() - desde.getTime())
  const minutos = Math.floor(ms / 60_000)
  if (minutos < 60) return minutos <= 1 ? 'hace un minuto' : `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return horas === 1 ? 'hace 1 hora' : `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}
