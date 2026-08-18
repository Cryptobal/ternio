/**
 * Copy único del flujo de cotización. Home, /{rubro} y /{rubro}/{comuna}
 * tienen que decir lo mismo: sin cuenta para empezar; RUT y teléfono van
 * en el wizard; el OTP, después de enviar.
 */

export type PasoFlujo = {
  titulo: string
  texto: string
}

export function pasosComoFunciona(opciones?: {
  comuna?: string
  listaEspera?: boolean
}): PasoFlujo[] {
  const zona = opciones?.comuna?.trim()
  const teContactan = opciones?.listaEspera
    ? zona
      ? `Te avisamos apenas haya empresas de este rubro atendiendo ${zona}.`
      : 'Te avisamos cuando haya empresas de este rubro en tu zona.'
    : zona
      ? `Las empresas que atienden ${zona} te contactan. Máximo tres. Tú eliges.`
      : 'Máximo tres empresas. Tú eliges.'

  return [
    {
      titulo: '1. Cuéntanos qué necesitas',
      texto: 'Elige comuna y responde unas preguntas. Sin cuenta para empezar.',
    },
    {
      titulo: '2. RUT y teléfono van en el formulario',
      texto: 'Los pedimos ahí mismo. El código al celular, después de enviar.',
    },
    {
      titulo: '3. Te contactan',
      texto: teContactan,
    },
  ]
}

export const TITULO_404 = 'No encontramos esta página — Ternio'
