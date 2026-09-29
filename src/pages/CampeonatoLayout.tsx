import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { ApiError, obtenerCampeonato } from '../api'
import type { Campeonato } from '../data/campeonatos'
import './CampeonatoLayout.css'
import './Home.css'

export type ContextoCampeonato = { campeonato: Campeonato }

export function CampeonatoLayout() {
  const { campeonatoId = '' } = useParams()
  const [campeonato, setCampeonato] = useState<Campeonato | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'ausente'>('cargando')
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    setError('')
    obtenerCampeonato(campeonatoId)
      .then((dato) => {
        if (!activo) return
        setCampeonato(dato)
        setEstado('listo')
      })
      .catch((causa: unknown) => {
        if (!activo) return
        if (causa instanceof ApiError && causa.status === 404) {
          setEstado('ausente')
          return
        }
        setError(causa instanceof Error ? causa.message : 'No se ha podido cargar el campeonato.')
        setEstado('ausente')
      })
    return () => {
      activo = false
    }
  }, [campeonatoId])

  if (estado === 'cargando') {
    return (
      <section className="home">
        <p className="lead">Cargando el campeonato…</p>
      </section>
    )
  }

  if (!campeonato || estado === 'ausente') {
    return (
      <section className="home">
        <p className="eyebrow">The Lake</p>
        <h1>Campeonato no encontrado</h1>
        <p className="lead">{error || 'Ese campeonato no existe.'}</p>
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
      <Outlet context={{ campeonato } satisfies ContextoCampeonato} />
    </section>
  )
}

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'subnav__link subnav__link--active' : 'subnav__link'
}
