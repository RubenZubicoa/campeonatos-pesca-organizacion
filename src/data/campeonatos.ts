export type Campeonato = {
  id: string
  nombre: string
  fecha: string
  lugar: string
}

export const campeonatos: Campeonato[] = [
  {
    id: 'primavera-2026',
    nombre: 'Campeonato de primavera',
    fecha: '12 abril 2026',
    lugar: 'The Lake',
  },
  {
    id: 'otono-2026',
    nombre: 'Campeonato de otoño',
    fecha: '18 octubre 2026',
    lugar: 'The Lake',
  },
]

export function getCampeonato(id: string | undefined) {
  return campeonatos.find((campeonato) => campeonato.id === id)
}
