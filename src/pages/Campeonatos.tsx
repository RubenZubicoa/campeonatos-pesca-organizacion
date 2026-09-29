import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarCampeonatos } from '../api'
import type { Campeonato } from '../data/campeonatos'
import './Home.css'

export function Campeonatos() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    listarCampeonatos()
      .then((lista) => {
        if (activo) setCampeonatos(lista)
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : 'No se han podido cargar los campeonatos.')
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <section className="home">
      <p className="eyebrow">The Lake</p>
      <h1>Campeonatos</h1>
      <p className="lead">
        Cada campeonato es independiente. Participantes y clasificación viven
        dentro de la prueba que les corresponde.
      </p>
      {error && <p className="lead">{error}</p>}
      <ul className="home__cards">
        {campeonatos.map((campeonato) => (
          <li key={campeonato.id}>
            <Link className="card-link" to={`/campeonatos/${campeonato.id}`}>
              <h2>{campeonato.nombre}</h2>
              <p>
                {campeonato.fecha} · {campeonato.lugar}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
