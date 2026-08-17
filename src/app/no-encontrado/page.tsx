import { notFound } from 'next/navigation'

/**
 * Destino del rewrite que usa el middleware para responder 404 sin revelar
 * nada (ver src/middleware.ts). Renderiza la misma página de "no encontrado"
 * del sitio, con status 404 real.
 */
export default function PaginaNoEncontrada(): never {
  notFound()
}
