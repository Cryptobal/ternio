'use client'

import { useEffect, useRef } from 'react'

/**
 * Mide el embudo de Fase 0 desde el navegador (VISITA_PAGINA y FORM_START).
 *
 * Va por el cliente a propósito: las páginas {rubro}/{comuna} se sirven con
 * ISR, así que contar visitas en el servidor las volvería dinámicas.
 * El identificador es anónimo y aleatorio: nunca lleva datos personales.
 */

const CLAVE_SESION = 'ternio_sesion_anon'

function sesionAnonId(): string {
  try {
    const guardado = window.localStorage.getItem(CLAVE_SESION)
    if (guardado) return guardado
    const nuevo = crypto.randomUUID()
    window.localStorage.setItem(CLAVE_SESION, nuevo)
    return nuevo
  } catch {
    // Si el navegador bloquea el almacenamiento, medimos sin persistencia.
    return crypto.randomUUID()
  }
}

export function registrarEventoCliente(
  tipo: 'VISITA_PAGINA' | 'FORM_START',
  datos: { rubro?: string; comuna?: string },
): void {
  const cuerpo = JSON.stringify({
    tipo,
    rubro: datos.rubro,
    comuna: datos.comuna,
    path: window.location.pathname,
    sesionAnonId: sesionAnonId(),
  })

  // keepalive para que el evento sobreviva a la navegación.
  void fetch('/api/eventos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {
    // Perder una métrica nunca puede romperle la página a un comprador.
  })
}

export function MedidorVisita({ rubro, comuna }: { rubro: string; comuna: string }) {
  const yaEnviado = useRef(false)

  useEffect(() => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    registrarEventoCliente('VISITA_PAGINA', { rubro, comuna })
  }, [rubro, comuna])

  return null
}
