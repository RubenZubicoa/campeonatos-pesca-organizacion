export type Campeonato = {
  id: string
  nombre: string
  fecha: string
  lugar: string
  medidaMinima: number
  puntosT: number
  duos: boolean
}

export const campeonatos: Campeonato[] = [
  {
    id: 'primavera-2026',
    nombre: 'Campeonato de primavera',
    fecha: '12 abril 2026',
    lugar: 'The Lake',
    medidaMinima: 0,
    puntosT: 0,
    duos: false,
  },
  {
    id: 'otono-2026',
    nombre: 'Campeonato de otoño',
    fecha: '18 octubre 2026',
    lugar: 'The Lake',
    medidaMinima: 0,
    puntosT: 0,
    duos: false,
  },
]

export function getCampeonato(id: string | undefined) {
  return campeonatos.find((campeonato) => campeonato.id === id)
}
