/**
 * Rate limit de ventana fija, en memoria del proceso.
 *
 * Alcance consciente para Fase 0: frena el abuso barato (envíos repetidos del
 * formulario, fuerza bruta en el login del admin) sin sumar infraestructura.
 * No es un límite global: cada instancia serverless lleva su propio contador.
 * Cuando haya varias instancias, esto se reemplaza por un contador compartido.
 */

type Ventana = { conteo: number; expiraEn: number }

const ventanas = new Map<string, Ventana>()

export type ResultadoRateLimit = {
  permitido: boolean
  restantes: number
  reintentarEnSegundos: number
}

export function consumirRateLimit(
  clave: string,
  limite: number,
  ventanaMs: number,
  ahora: number = Date.now(),
): ResultadoRateLimit {
  const actual = ventanas.get(clave)

  if (!actual || actual.expiraEn <= ahora) {
    ventanas.set(clave, { conteo: 1, expiraEn: ahora + ventanaMs })
    return { permitido: true, restantes: limite - 1, reintentarEnSegundos: 0 }
  }

  actual.conteo += 1

  if (actual.conteo > limite) {
    return {
      permitido: false,
      restantes: 0,
      reintentarEnSegundos: Math.ceil((actual.expiraEn - ahora) / 1000),
    }
  }

  return {
    permitido: true,
    restantes: limite - actual.conteo,
    reintentarEnSegundos: 0,
  }
}

/** Solo para tests: limpia el estado entre casos. */
export function reiniciarRateLimit(): void {
  ventanas.clear()
}
