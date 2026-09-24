import { NavLink, Outlet, useParams } from 'react-router-dom'
import { getCampeonato } from '../data/campeonatos'
import './CampeonatoLayout.css'
import './Home.css'

export function CampeonatoLayout() {
  const { campeonatoId } = useParams()
  const campeonato = getCampeonato(campeonatoId)

  if (!campeonato) {
    return (
      <section className="home">
        <p className="eyebrow">The Lake</p>
        <h1>Campeonato no encontrado</h1>
        <p className="lead">Ese campeonato no existe.</p>
      </section>
    )
  }

  return (
    <section className="campeonato">
      <p className="eyebrow">Campeonato</p>
      <h1>{campeonato.nombre}</h1>
      <p className="lead">
        {campeonato.fecha} · {campeonato.lugar}
      </p>
      <nav className="subnav" aria-label="Secciones del campeonato">
        <NavLink to="." end className={linkClass}>
          Resumen
        </NavLink>
        <NavLink to="escenario" className={linkClass}>
          Escenario de pesca
        </NavLink>
        <NavLink to="participantes" className={linkClass}>
          Participantes
        </NavLink>
        <NavLink to="mangas" className={linkClass}>
          Mangas de pesca
        </NavLink>
        <NavLink to="clasificacion" className={linkClass}>
          Clasificación
        </NavLink>
      </nav>
      <Outlet />
    </section>
  )
}

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'subnav__link subnav__link--active' : 'subnav__link'
}
