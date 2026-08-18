import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { pasosComoFunciona, TITULO_404 } from '@/lib/copy-flujo'

describe('pasosComoFunciona', () => {
  it('es honesto: sin cuenta, RUT y teléfono en el wizard, OTP después', () => {
    const pasos = pasosComoFunciona()
    expect(pasos[0]?.texto).toMatch(/Sin cuenta para empezar/)
    expect(pasos[1]?.titulo).toMatch(/RUT y teléfono/)
    expect(pasos[1]?.texto).toMatch(/después de enviar/)
    expect(pasos.map((paso) => paso.titulo).join(' ')).not.toMatch(/Confirmamos RUT/)
  })

  it('en lista de espera no inventa que te contactan empresas', () => {
    const pasos = pasosComoFunciona({ comuna: 'Valdivia', listaEspera: true })
    expect(pasos[2]?.texto).toMatch(/avisamos/)
    expect(pasos[2]?.texto).toMatch(/Valdivia/)
  })
})

describe('copy público sin mentiras de launch', () => {
  it('el honeypot no muestra “No completar”', () => {
    const archivos = [
      'src/components/campo-honeypot.tsx',
      'src/components/formulario-cuenta-proveedor.tsx',
      'src/components/formulario-cotizacion.tsx',
    ]
    for (const archivo of archivos) {
      const src = readFileSync(resolve(process.cwd(), archivo), 'utf8')
      expect(src).not.toContain('No completar')
    }
  })

  it('el 404 tiene title propio, no el de la home', () => {
    const notFound = readFileSync(resolve(process.cwd(), 'src/app/not-found.tsx'), 'utf8')
    const rewrite = readFileSync(resolve(process.cwd(), 'src/app/no-encontrado/page.tsx'), 'utf8')
    expect(TITULO_404).not.toMatch(/cotiza servicios para tu empresa/)
    expect(notFound).toContain('TITULO_404')
    expect(rewrite).toContain('TITULO_404')
  })

  it('tus cotizaciones no se llaman panel', () => {
    const mis = readFileSync(resolve(process.cwd(), 'src/app/(sitio)/mis-cotizaciones/page.tsx'), 'utf8')
    const enviada = readFileSync(
      resolve(process.cwd(), 'src/app/(sitio)/cotizacion/enviada/page.tsx'),
      'utf8',
    )
    expect(mis).not.toMatch(/Panel privado|Mi panel|tu panel/i)
    expect(mis).toMatch(/Tus cotizaciones/)
    expect(mis).toContain('EstadoCompraLead.PAGADA')
    expect(mis).not.toContain('LeadContacto')
    expect(enviada).not.toMatch(/tu panel/i)
    expect(enviada).toMatch(/este celular para seguir la solicitud/)

    const marco = readFileSync(resolve(process.cwd(), 'src/components/sitio/marco-publico.tsx'), 'utf8')
    expect(marco).toContain('Ya cotizé')
    expect(marco).toContain('href="/entrar"')
    expect(marco).not.toMatch(/Mi panel/)

    const otp = readFileSync(resolve(process.cwd(), 'src/components/formulario-otp.tsx'), 'utf8')
    expect(otp).not.toMatch(/entrada al panel/i)
    expect(otp).toMatch(/Crea tu acceso o entra con este celular/)
  })

  it('el selector de territorio no apila niveles ni usa typeahead', () => {
    const territorio = readFileSync(
      resolve(process.cwd(), 'src/components/selector-territorio.tsx'),
      'utf8',
    )
    const home = readFileSync(resolve(process.cwd(), 'src/components/selector-cotizacion.tsx'), 'utf8')
    const inicio = readFileSync(resolve(process.cwd(), 'src/app/(sitio)/page.tsx'), 'utf8')
    expect(territorio).toContain('debeMostrarNivelTerritorio')
    expect(territorio).not.toMatch(/buscar comuna|typeahead|<select/i)
    expect(territorio).not.toMatch(/Primero elige la región|Primero elige la provincia/)
    expect(home).toContain('{rubro ?')
    expect(home).toContain('SelectorTerritorio')
    expect(home).not.toMatch(/enVenta\[0\]/)
    expect(inicio).toContain('SelectorCotizacion')
    expect(inicio).not.toMatch(/atajosHome/)
    expect(inicio).not.toMatch(/>Servicios</)
  })

  it('robots y sitemap no publican /admin', () => {
    const robots = readFileSync(resolve(process.cwd(), 'src/app/robots.ts'), 'utf8')
    expect(robots).not.toMatch(/['"`]\/admin/)
    expect(robots).toMatch(/nada de admin/)
  })
})
