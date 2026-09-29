import type { Campeonato } from './data/campeonatos'
import type { Captura } from './data/capturas'
import type { Manga, RangoHorario } from './data/mangas'
import type { Participante } from './data/participantes'
import type { EscenarioGuardado, Sector, Tramo } from './data/tramos'

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  requiereConfirmacion: boolean

  constructor(status: number, message: string, requiereConfirmacion = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requiereConfirmacion = requiereConfirmacion
  }
}

export type ClasificacionApi = {
  mangas: {
    id: string
    nombre: string
    filas: { participanteId: string; nombre: string | null; puntos: number | null; puesto: number | null }[]
  }[]
  final: {
    participanteId: string
    nombre: string | null
    puestos: (number | null)[]
    suma: number | null
    puntosTotales: number | null
    puesto: number | null
  }[]
}

export function listarCampeonatos() {
  return pedir<Campeonato[]>('/api/campeonatos')
}

export function obtenerCampeonato(id: string) {
  return pedir<Campeonato>(`/api/campeonatos/${id}`)
}

export function listarParticipantes(campeonatoId: string) {
  return pedir<Participante[]>(`/api/campeonatos/${campeonatoId}/participantes`)
}

export function crearParticipante(
  campeonatoId: string,
  datos: { nombre: string; fechaNacimiento: string; dni: string },
) {
  return pedir<Participante>(`/api/campeonatos/${campeonatoId}/participantes`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function quitarParticipante(campeonatoId: string, participanteId: string) {
  return pedir<void>(`/api/campeonatos/${campeonatoId}/participantes/${participanteId}`, {
    method: 'DELETE',
  })
}

export function obtenerEscenario(campeonatoId: string) {
  return pedir<EscenarioGuardado>(`/api/campeonatos/${campeonatoId}/escenario`)
}

export function crearSector(campeonatoId: string, nombre: string) {
  return pedir<Sector>(`/api/campeonatos/${campeonatoId}/sectores`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
}

export function quitarSector(campeonatoId: string, sectorId: string) {
  return pedir<void>(`/api/campeonatos/${campeonatoId}/sectores/${sectorId}`, { method: 'DELETE' })
}

export function crearTramo(
  campeonatoId: string,
  datos: { nombre: string; sectorId: string; latitud: number; longitud: number },
) {
  return pedir<Tramo>(`/api/campeonatos/${campeonatoId}/tramos`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function moverTramo(campeonatoId: string, tramoId: string, sectorId: string | null) {
  return pedir<Tramo>(`/api/campeonatos/${campeonatoId}/tramos/${tramoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ sectorId }),
  })
}

export function quitarTramo(campeonatoId: string, tramoId: string) {
  return pedir<void>(`/api/campeonatos/${campeonatoId}/tramos/${tramoId}`, { method: 'DELETE' })
}

export function listarMangas(campeonatoId: string) {
  return pedir<Manga[]>(`/api/campeonatos/${campeonatoId}/mangas`)
}

export function crearManga(
  campeonatoId: string,
  datos: { nombre: string; rangos: [RangoHorario, RangoHorario]; permitirRepeticion?: boolean },
) {
  return pedir<Manga>(`/api/campeonatos/${campeonatoId}/mangas`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function cambiarVisibilidadManga(campeonatoId: string, mangaId: string, visibleParaParticipantes: boolean) {
  return pedir<Manga>(`/api/campeonatos/${campeonatoId}/mangas/${mangaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ visibleParaParticipantes }),
  })
}

export function quitarManga(campeonatoId: string, mangaId: string) {
  return pedir<void>(`/api/campeonatos/${campeonatoId}/mangas/${mangaId}`, { method: 'DELETE' })
}

export function listarCapturas(campeonatoId: string, filtro?: { participanteId?: string; mangaId?: string }) {
  const params = new URLSearchParams()
  if (filtro?.participanteId) params.set('participanteId', filtro.participanteId)
  if (filtro?.mangaId) params.set('mangaId', filtro.mangaId)
  const consulta = params.size > 0 ? `?${params}` : ''
  return pedir<Captura[]>(`/api/campeonatos/${campeonatoId}/capturas${consulta}`)
}

export function crearCaptura(
  campeonatoId: string,
  datos: { participanteId: string; mangaId: string; longitud: number; fechaHora: string },
) {
  return pedir<Captura>(`/api/campeonatos/${campeonatoId}/capturas`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function actualizarCaptura(
  campeonatoId: string,
  capturaId: string,
  cambios: Partial<Pick<Captura, 'longitud' | 'fechaHora' | 'mangaId'>>,
) {
  return pedir<Captura>(`/api/campeonatos/${campeonatoId}/capturas/${capturaId}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  })
}

export function quitarCaptura(campeonatoId: string, capturaId: string) {
  return pedir<void>(`/api/campeonatos/${campeonatoId}/capturas/${capturaId}`, { method: 'DELETE' })
}

export function obtenerClasificacion(campeonatoId: string) {
  return pedir<ClasificacionApi>(`/api/campeonatos/${campeonatoId}/clasificacion`)
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'No se ha podido conectar con la API.')
  }

  if (respuesta.status === 204) return undefined as T
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: string; requiereConfirmacion?: boolean }
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos.error ?? 'No se ha podido completar la operación.', datos.requiereConfirmacion === true)
  }
  return datos as T
}
