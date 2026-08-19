'use client'

import { useEffect } from 'react'

import { CLAVE_TEMA, colorTemaMeta, esTema, type Tema } from '@/lib/tema'

/**
 * Admin y paneles quedan fuera del tema noche en esta ola.
 * Fuerza día al montar y restaura la preferencia del sitio al salir.
 */
export function ForzarTemaDia() {
  useEffect(() => {
    const anterior = document.documentElement.getAttribute('data-tema')
    document.documentElement.setAttribute('data-tema', 'dia')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', colorTemaMeta('dia'))

    return () => {
      const guardado = localStorage.getItem(CLAVE_TEMA)
      const restaurar: Tema = esTema(guardado)
        ? guardado
        : esTema(anterior)
          ? anterior
          : 'dia'
      document.documentElement.setAttribute('data-tema', restaurar)
      if (meta) meta.setAttribute('content', colorTemaMeta(restaurar))
    }
  }, [])

  return null
}
