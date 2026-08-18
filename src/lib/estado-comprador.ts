import { EstadoLead } from '@prisma/client'

export type ResumenCotizacionComprador = {
  estado: string
  siguiente?: string
}

/**
 * Estado honesto + próximo paso. Sin propuestas inventadas ni marketplace.
 */
export function resumenCotizacionComprador(lead: {
  estado: EstadoLead
  rutValido: boolean
  telefonoVerificado: boolean
}): ResumenCotizacionComprador {
  if (lead.estado === EstadoLead.DESCARTADO) {
    return { estado: 'No pudimos continuar con esta solicitud' }
  }
  if (lead.estado === EstadoLead.ARCHIVADO) {
    return { estado: 'Solicitud cerrada' }
  }

  if (!lead.telefonoVerificado) {
    return {
      estado: 'Recibimos tu solicitud',
      siguiente: 'Confirma el teléfono con el código que te enviamos. Después no lo volvemos a pedir.',
    }
  }

  if (lead.estado === EstadoLead.LISTA_ESPERA) {
    return {
      estado: 'Quedó en lista de espera',
      siguiente: 'Este servicio todavía no tiene empresas en Ternio. Te avisamos cuando se abra.',
    }
  }

  if (lead.estado === EstadoLead.VERIFICADO) {
    return {
      estado: 'Solicitud verificada',
      siguiente: 'Aún no enviamos tu solicitud a empresas. Te avisamos cuando eso esté listo.',
    }
  }

  return {
    estado: 'Estamos revisando tus datos',
    siguiente: lead.rutValido
      ? 'Revisamos tus datos. Te avisamos si falta algo.'
      : 'Revisamos el RUT. Te avisamos si falta algo.',
  }
}
