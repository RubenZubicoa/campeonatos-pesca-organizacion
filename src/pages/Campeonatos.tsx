import { Link } from 'react-router-dom'
import { campeonatos } from '../data/campeonatos'
import './Home.css'

export function Campeonatos() {
  return (
    <section className="home">
      <p className="eyebrow">The Lake</p>
      <h1>Campeonatos</h1>
      <p className="lead">
        Cada campeonato es independiente. Participantes y clasificación viven
        dentro de la prueba que les corresponde.
      </p>
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
