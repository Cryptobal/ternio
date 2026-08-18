import { EstadoLead } from '@prisma/client'

export type HitoTimeline = {
  id: string
  titulo: string
  detalle?: string
  estado: 'hecho' | 'actual' | 'pendiente'
}

export function hitosTimelineLead(lead: {
  estado: EstadoLead
  rutValido: boolean
  telefonoVerificado: boolean
}): HitoTimeline[] {
  const recibida: HitoTimeline = {
    id: 'recibida',
    titulo: 'Solicitud recibida',
    estado: 'hecho',
  }

  const verificacionHecha = lead.rutValido && lead.telefonoVerificado
  const verificando =
    lead.estado === EstadoLead.RECIBIDO || lead.estado === EstadoLead.EN_REVISION

  const verificacion: HitoTimeline = {
    id: 'verificacion',
    titulo: verificacionHecha ? 'Datos verificados' : 'Verificando tus datos',
    detalle: [
      lead.rutValido ? 'RUT válido' : 'RUT pendiente',
      lead.telefonoVerificado ? 'Teléfono confirmado' : 'Teléfono pendiente',
    ].join(' · '),
    estado: verificacionHecha ? 'hecho' : verificando ? 'actual' : 'pendiente',
  }

  let cierre: HitoTimeline
  if (lead.estado === EstadoLead.LISTA_ESPERA) {
    cierre = {
      id: 'cierre',
      titulo: 'Buscando empresas en tu zona',
      estado: 'actual',
    }
  } else if (lead.estado === EstadoLead.VERIFICADO) {
    cierre = {
      id: 'cierre',
      titulo: 'Lista para que te contacten',
      detalle: 'Hasta tres empresas pueden tomar tu solicitud.',
      estado: 'hecho',
    }
  } else if (lead.estado === EstadoLead.DESCARTADO) {
    cierre = {
      id: 'cierre',
      titulo: 'No pudimos continuar',
      estado: 'hecho',
    }
  } else if (lead.estado === EstadoLead.ARCHIVADO) {
    cierre = {
      id: 'cierre',
      titulo: 'Solicitud cerrada',
      estado: 'hecho',
    }
  } else {
    cierre = {
      id: 'cierre',
      titulo: 'En espera de verificación',
      estado: 'pendiente',
    }
  }

  return [recibida, verificacion, cierre]
}
