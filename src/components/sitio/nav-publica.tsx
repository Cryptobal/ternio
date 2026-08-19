'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { Logo } from '@/components/marca/logo'
import { InterruptorTema } from '@/components/sitio/interruptor-tema'

const ENLACES = [
  { href: '/como-funciona', etiqueta: 'Cómo funciona' },
  { href: '/precios', etiqueta: 'Precios' },
  { href: '/#servicios', etiqueta: 'Servicios', match: '/' },
  { href: '/blog', etiqueta: 'Blog' },
] as const

const ANCHO_MENU_PX = 900

function rutaActiva(pathname: string, href: string, match?: string): boolean {
  if (href.startsWith('/#')) return false
  const base = match ?? href
  if (base === '/') return pathname === '/'
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function NavPublica() {
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  useEffect(() => {
    if (!menuAbierto) return
    function tecla(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuAbierto(false)
        botonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [menuAbierto])

  useEffect(() => {
    function resize() {
      if (window.innerWidth >= ANCHO_MENU_PX) setMenuAbierto(false)
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-(--color-hero)/95 text-white backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" aria-label="Ternio, ir al inicio" className="shrink-0">
          <Logo variante="oscuro" />
        </Link>

        <nav
          className="ml-2 hidden items-center gap-1 min-[900px]:flex"
          aria-label="Principal"
        >
          {ENLACES.map((enlace) => {
            const activo = rutaActiva(pathname, enlace.href, 'match' in enlace ? enlace.match : undefined)
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                aria-current={activo ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium transition ${
                  activo
                    ? 'bg-white/12 text-white'
                    : 'text-white/80 hover:bg-white/8 hover:text-white'
                }`}
              >
                {enlace.etiqueta}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <InterruptorTema />
          <Link
            href="/entrar"
            className="hidden min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-white/90 underline-offset-4 transition hover:text-white hover:underline min-[900px]:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/proveedores"
            className="hidden min-h-11 items-center rounded-full border border-(--color-ambar) px-4 py-2 text-sm font-semibold text-(--color-ambar) transition hover:bg-(--color-ambar) hover:text-(--color-tinta) min-[900px]:inline-flex"
          >
            Soy proveedor
          </Link>

          <button
            ref={botonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white/55 hover:bg-white/10 min-[900px]:hidden"
            aria-expanded={menuAbierto}
            aria-controls={panelId}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            {menuAbierto ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuAbierto ? (
        <div
          id={panelId}
          className="border-t border-white/10 bg-(--color-hero) px-4 py-4 min-[900px]:hidden"
        >
          <nav aria-label="Menú móvil" className="flex flex-col gap-1">
            {ENLACES.map((enlace) => {
              const activo = rutaActiva(pathname, enlace.href, 'match' in enlace ? enlace.match : undefined)
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  aria-current={activo ? 'page' : undefined}
                  onClick={() => setMenuAbierto(false)}
                  className={`inline-flex min-h-11 items-center rounded-2xl px-4 py-2 text-base font-medium ${
                    activo ? 'bg-white/12 text-white' : 'text-white/90 hover:bg-white/8'
                  }`}
                >
                  {enlace.etiqueta}
                </Link>
              )
            })}
            <Link
              href="/entrar"
              onClick={() => setMenuAbierto(false)}
              className="inline-flex min-h-11 items-center rounded-2xl px-4 py-2 text-base font-medium text-white/90 hover:bg-white/8"
            >
              Entrar
            </Link>
            <Link
              href="/proveedores"
              onClick={() => setMenuAbierto(false)}
              className="mt-1 inline-flex min-h-12 items-center justify-center rounded-2xl border border-(--color-ambar) px-4 py-2 text-base font-semibold text-(--color-ambar)"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
