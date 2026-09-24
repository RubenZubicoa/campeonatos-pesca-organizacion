export type Captura = {
  id: string
  participanteId: string
  mangaId: string
  longitud: number
  fechaHora: string
}

const clave = (campeonatoId: string) => `thelake-capturas:${campeonatoId}`

export function loadCapturas(campeonatoId: string): Captura[] {
  const raw = localStorage.getItem(clave(campeonatoId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Captura[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCapturas(campeonatoId: string, capturas: Captura[]) {
  localStorage.setItem(clave(campeonatoId), JSON.stringify(capturas))
}

export function capturasDe(capturas: Captura[], participanteId: string, mangaId: string) {
  return capturas
    .filter((captura) => captura.participanteId === participanteId && captura.mangaId === mangaId)
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
}
