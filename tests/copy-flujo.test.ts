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
    // La página no se autodenomina panel; el enlace cruzado al panel de proveedor sí.
    expect(mis).toMatch(/Tus cotizaciones/)
    expect(mis).not.toMatch(/Panel privado|tu panel/i)
    expect(mis).not.toMatch(/title:\s*['"].*panel/i)
    expect(mis).toContain('Ir a mi panel de proveedor')
    expect(mis).toContain('EstadoCompraLead.PAGADA')
    expect(mis).not.toContain('LeadContacto')
    expect(enviada).not.toMatch(/tu panel/i)
    expect(enviada).toMatch(/este celular para seguir la solicitud/)

    const marco = readFileSync(resolve(process.cwd(), 'src/components/sitio/marco-publico.tsx'), 'utf8')
    expect(marco).not.toMatch(/Páginas ya publicadas|Sin URLs inventadas|Cotiza en tu comuna/)
    expect(marco).toContain('Entrar')
    expect(marco).not.toContain('Ya coticé')
    expect(marco).toContain('href="/entrar"')
    expect(marco).toContain('Soy proveedor')
    expect(marco).not.toMatch(/Mi panel/)

    const otp = readFileSync(resolve(process.cwd(), 'src/components/formulario-otp.tsx'), 'utf8')
    expect(otp).not.toMatch(/entrada al panel/i)
    expect(otp).toMatch(/Crea tu acceso o entra con este celular/)
  })

  it('el selector de territorio muestra un nivel a la vez; el cotizador pide la cascada al tiro', () => {
    const territorio = readFileSync(
      resolve(process.cwd(), 'src/components/selector-territorio.tsx'),
      'utf8',
    )
    const home = readFileSync(resolve(process.cwd(), 'src/components/selector-cotizacion.tsx'), 'utf8')
    const inicio = readFileSync(resolve(process.cwd(), 'src/app/(sitio)/page.tsx'), 'utf8')
    const combo = readFileSync(resolve(process.cwd(), 'src/components/combo-servicio.tsx'), 'utf8')
    expect(territorio).toContain('debeMostrarNivelTerritorio')
    expect(territorio).not.toMatch(/Primero elige la región|Primero elige la provincia/)
    expect(territorio).not.toMatch(/<select/)
    expect(home).toContain('pasoCotizador')
    expect(home).toContain('ComboServicio')
    expect(home).toContain('SelectorTerritorio')
    expect(home).toContain('PREGUNTA_AUDIENCIA')
    expect(home).toContain('audienciaInicialParaPagina')
    expect(home).toContain('abrirAlMontar')
    expect(home).not.toMatch(/\bfrecuentes\b/)
    expect(home).not.toMatch(/CLASE_SUPERFICIE/)
    expect(home).not.toMatch(/enVenta\[0\]/)
    expect(combo).toContain('max-h-72')
    expect(combo).toContain('Escribe el servicio')
    expect(inicio).toContain('SelectorCotizacion')
    expect(inicio).toContain('SelectorLugarCombos')
    expect(inicio).toMatch(/casa o tu empresa/)
    expect(inicio).not.toMatch(/atajosHome/)
    expect(inicio).not.toMatch(/Guardias de seguridad/)
    expect(inicio).not.toMatch(/Páginas ya publicadas|Sin URLs inventadas|Cotiza en tu comuna/)
    const landing = readFileSync(resolve(process.cwd(), 'src/app/(seo)/[rubro]/page.tsx'), 'utf8')
    expect(landing).toContain('SelectorCotizacion')
    expect(landing).toContain('rubroInicial')
    expect(landing).not.toMatch(/SelectorComunaCta|CLASE_SUPERFICIE/)
  })

  it('el admin muestra los precios de lanzamiento del seed', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/app/admin/rubros/formulario-rubro.tsx'),
      'utf8',
    )
    expect(form).toContain('preciosLanzamiento')
    expect(form).toContain('1 crédito = $1')
  })

  it('robots y sitemap no publican /admin', () => {
    const robots = readFileSync(resolve(process.cwd(), 'src/app/robots.ts'), 'utf8')
    expect(robots).not.toMatch(/['"`]\/admin/)
    expect(robots).toMatch(/nada de admin/)
  })
})
