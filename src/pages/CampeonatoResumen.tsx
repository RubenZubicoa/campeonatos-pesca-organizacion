import { Link, useOutletContext } from 'react-router-dom'
import type { ContextoCampeonato } from './CampeonatoLayout'
import './Home.css'

export function CampeonatoResumen() {
  const { campeonato } = useOutletContext<ContextoCampeonato>()

  return (
    <ul className="home__cards">
      <li>
        <Link className="card-link" to="escenario">
          <h2>Escenario de pesca</h2>
          <p>Mapa del escenario y tramos de esta prueba.</p>
        </Link>
      </li>
      <li>
        <Link className="card-link" to="participantes">
          <h2>Participantes</h2>
          <p>Inscripciones propias de {campeonato.nombre}.</p>
        </Link>
      </li>
      <li>
        <Link className="card-link" to="mangas">
          <h2>Mangas de pesca</h2>
          <p>Horarios y reparto de tramos de cada manga.</p>
        </Link>
      </li>
      <li>
        <Link className="card-link" to="clasificacion">
          <h2>Clasificación</h2>
          <p>Resultados solo de esta prueba.</p>
        </Link>
      </li>
    </ul>
  )
}
