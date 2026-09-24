export type Sector = {
  id: string
  nombre: string
}

export type Tramo = {
  id: string
  nombre: string
  sectorId: string | null
  latitud: number
  longitud: number
}

type TramoAntiguo = Tramo & {
  puntos?: { lat: number; lng: number }[]
  latitud?: number
  longitud?: number
}

export type EscenarioGuardado = {
  sectores: Sector[]
  tramos: Tramo[]
}

const keyFor = (campeonatoId: string) => `thelake-tramos:${campeonatoId}`

const vacio: EscenarioGuardado = { sectores: [], tramos: [] }

export function loadEscenario(campeonatoId: string): EscenarioGuardado {
  const raw = localStorage.getItem(keyFor(campeonatoId))
  if (!raw) return vacio
  try {
    const parsed = JSON.parse(raw) as EscenarioGuardado | Tramo[]
    if (Array.isArray(parsed)) {
      return { sectores: [], tramos: parsed.flatMap(normalizarTramo) }
    }
    return {
      sectores: Array.isArray(parsed.sectores) ? parsed.sectores : [],
      tramos: Array.isArray(parsed.tramos) ? parsed.tramos.flatMap(normalizarTramo) : [],
    }
  } catch {
    return vacio
  }
}

function normalizarTramo(tramo: TramoAntiguo): Tramo[] {
  const latitud = tramo.latitud ?? tramo.puntos?.[0]?.lat
  const longitud = tramo.longitud ?? tramo.puntos?.[0]?.lng
  if (latitud == null || longitud == null || !tramo.id || !tramo.nombre) return []
  return [{ id: tramo.id, nombre: tramo.nombre, sectorId: tramo.sectorId ?? null, latitud, longitud }]
}

export function saveEscenario(campeonatoId: string, escenario: EscenarioGuardado) {
  localStorage.setItem(keyFor(campeonatoId), JSON.stringify(escenario))
}

export const coloresSector = ['#d1b04a', '#7ec8e3', '#e07a5f', '#81b29a', '#f2cc8f', '#c4b5fd']

export function colorDeSector(sectores: Sector[], sectorId: string | null) {
  const indice = sectores.findIndex((sector) => sector.id === sectorId)
  if (indice < 0) return '#d1b04a'
  return coloresSector[indice % coloresSector.length]
}
