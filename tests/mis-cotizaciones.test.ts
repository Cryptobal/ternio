import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('tus cotizaciones', () => {
  it('no se presenta como panel y solo cuenta compras PAGADA, sin PII ajena', () => {
    const pagina = readFileSync(
      resolve(process.cwd(), 'src/app/(sitio)/mis-cotizaciones/page.tsx'),
      'utf8',
    )
    expect(pagina).not.toMatch(/Panel privado|Mi panel|panel del comprador/)
    expect(pagina).toMatch(/Tus cotizaciones/)
    expect(pagina).toMatch(/EstadoCompraLead\.PAGADA/)
    expect(pagina).toMatch(/textoEmpresasTomaron/)
    expect(pagina).toMatch(/recapDatosComprador/)
    expect(pagina).not.toMatch(/contacto:\s*true|proveedor:\s*\{/)
    expect(pagina).not.toMatch(/LeadContacto/)
  })
})
