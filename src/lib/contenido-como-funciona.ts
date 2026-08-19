/**
 * Copy de /como-funciona.
 * Fuente: docs/como-funciona.md + código real. Si difieren, manda el código.
 *
 * Diferencias conscientes vs docs/como-funciona.md:
 * - El doc describe OTP como único login del comprador; el sitio también
 *   ofrece reingreso por celular en /entrar (misma OTP).
 * - El doc dice "Región → Provincia → Comuna (sin typeahead)"; el cotizador
 *   de la home pide esa cascada al tiro después del servicio.
 * - El proveedor puede entrar con correo+contraseña además del OTP.
 */

export type PasoFlujo = {
  titulo: string
  texto: string
}

export type LadoFlujo = {
  id: 'comprador' | 'proveedor'
  etiqueta: string
  pasos: readonly PasoFlujo[]
  cierre: string
  cta: { href: string; etiqueta: string }
}

export const HERO_COMO_FUNCIONA = {
  titulo: 'Así funciona Ternio',
  bajada:
    'Cotizas gratis. Las empresas ven una ficha anónima y pagan solo si quieren tu contacto.',
} as const

export const LADO_COMPRADOR: LadoFlujo = {
  id: 'comprador',
  etiqueta: 'Necesito un servicio',
  pasos: [
    {
      titulo: 'Dices qué necesitas',
      texto:
        'Eliges casa o empresa, el servicio y la comuna. Después respondes unas pocas preguntas y dejas tus datos.',
    },
    {
      titulo: 'Verificamos RUT y celular',
      texto:
        'Validamos el dígito verificador del RUT y te enviamos un código SMS. Sin eso, la solicitud no se vende.',
    },
    {
      titulo: 'Las empresas ven una ficha anónima',
      texto:
        'Ven el servicio, la comuna y las señales de verificación. Tu nombre, teléfono y correo quedan ocultos.',
    },
    {
      titulo: 'Te contactan hasta tres',
      texto:
        'Como máximo tres empresas en compartido. Si una compra el exclusivo, se cierra para el resto.',
    },
  ],
  cierre:
    'Tú no pagas nunca. Ni al cotizar, ni al recibir propuestas, ni al cerrar el trato. No hay versión de pago para ti.',
  cta: { href: '/#cotizador', etiqueta: 'Pedir cotización' },
}

export const LADO_PROVEEDOR: LadoFlujo = {
  id: 'proveedor',
  etiqueta: 'Presto un servicio',
  pasos: [
    {
      titulo: 'Creas cuenta y eliges cobertura',
      texto:
        'Dejas los datos de tu empresa, los rubros que atiendes y dónde operas. Confirmas el celular con un código.',
    },
    {
      titulo: 'Te avisamos al instante',
      texto:
        'Cuando un comprador queda verificado y calza con tu cobertura, te llega un correo con la ficha anónima.',
    },
    {
      titulo: 'Decides si vale la pena',
      texto:
        'Ves rubro, comuna, señales y el precio según la frescura. Sin compromiso: si no te sirve, lo dejas.',
    },
    {
      titulo: 'Pagas solo el contacto',
      texto:
        'Compras con créditos. Si el teléfono no contesta o los datos son falsos, reclamas dentro de 48 h y revisamos la reposición.',
    },
  ],
  cierre:
    'Sin mensualidad. Compras créditos cuando quieres y los gastas solo en los contactos que te sirven.',
  cta: { href: '/proveedores', etiqueta: 'Crear cuenta de proveedor' },
}

export const LADOS_COMO_FUNCIONA = [LADO_COMPRADOR, LADO_PROVEEDOR] as const
