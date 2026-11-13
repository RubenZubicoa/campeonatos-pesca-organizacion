import { useEffect, useMemo, useState } from 'react'
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api'
import { useOutletContext, useParams } from 'react-router-dom'
import { crearSector, crearTramo, moverTramo, obtenerEscenario, quitarSector, quitarTramo } from '../api'
import {
  colorDeSector,
  type Sector,
  type Tramo,
} from '../data/tramos'
import type { ContextoCampeonato } from './CampeonatoLayout'
import './Escenario.css'

const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY ?? ''

function encuadrarTramos(mapa: google.maps.Map, tramos: Tramo[]) {
  if (tramos.length < 2) return
  const limites = new google.maps.LatLngBounds()
  for (const tramo of tramos) {
    limites.extend({ lat: tramo.latitud, lng: tramo.longitud })
  }
  mapa.fitBounds(limites, 64)
}

function vistaInicial(tramos: Tramo[]) {
  if (tramos.length === 0) return { center: { lat: 40.2, lng: -3.5 }, zoom: 6 }
  const latitud = tramos.reduce((suma, tramo) => suma + tramo.latitud, 0) / tramos.length
  const longitud = tramos.reduce((suma, tramo) => suma + tramo.longitud, 0) / tramos.length
  return { center: { lat: latitud, lng: longitud }, zoom: tramos.length === 1 ? 16 : 14 }
}

export function Escenario() {
  const { campeonatoId = '' } = useParams()
  const { campeonato } = useOutletContext<ContextoCampeonato>()
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'thelake-google-maps',
    googleMapsApiKey: apiKey,
  })
  const [vista, setVista] = useState(() => vistaInicial([]))
  const [listo, setListo] = useState(false)
  const [aviso, setAviso] = useState('')
  const [sectores, setSectores] = useState<Sector[]>([])
  const [tramos, setTramos] = useState<Tramo[]>([])
  const [nombreSector, setNombreSector] = useState('')
  const [nombre, setNombre] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [punto, setPunto] = useState<{ latitud: number; longitud: number } | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [sectorVisible, setSectorVisible] = useState('todos')

  useEffect(() => {
    let activo = true
    obtenerEscenario(campeonatoId)
      .then((escenario) => {
        if (!activo) return
        setSectores(escenario.sectores)
        setTramos(escenario.tramos)
        setSectorId(escenario.sectores[0]?.id ?? '')
        setVista(vistaInicial(escenario.tramos))
        setListo(true)
      })
      .catch((causa: unknown) => {
        if (activo) setAviso(causa instanceof Error ? causa.message : 'No se ha podido cargar el escenario.')
      })
    return () => {
      activo = false
    }
  }, [campeonatoId])

  const grupos = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase()
    const visibles = tramos.filter((tramo) => {
      const coincideNombre = !consulta || tramo.nombre.toLowerCase().includes(consulta)
      const coincideSector =
        sectorVisible === 'todos' ||
        (sectorVisible === 'sin-sector' ? !tramo.sectorId : tramo.sectorId === sectorVisible)
      return coincideNombre && coincideSector
    })
    const asignados = new Set<string>()
    const porSector = sectores
      .filter((sector) => sectorVisible === 'todos' || sectorVisible === sector.id)
      .map((sector) => {
        const delSector = visibles.filter((tramo) => tramo.sectorId === sector.id)
        delSector.forEach((tramo) => asignados.add(tramo.id))
        return { sector, tramos: delSector }
      })
      .filter((grupo) => grupo.tramos.length > 0 || (sectorVisible === 'todos' && !consulta))
    const sueltos = visibles.filter((tramo) => !asignados.has(tramo.id))
    return { porSector, sueltos, total: visibles.length }
  }, [sectores, tramos, busqueda, sectorVisible])

  async function anadirSector() {
    const titulo = nombreSector.trim()
    if (!titulo) return
    try {
      const sector = await crearSector(campeonatoId, titulo)
      setSectores((actual) => [...actual, sector])
      setNombreSector('')
      if (!sectorId) setSectorId(sector.id)
      setAviso('')
    } catch (causa: unknown) {
      setAviso(causa instanceof Error ? causa.message : 'No se ha podido crear el sector.')
    }
  }

  async function quitarSectorDe(id: string) {
    try {
      await quitarSector(campeonatoId, id)
      setSectores((actual) => actual.filter((sector) => sector.id !== id))
      setTramos((actual) => actual.map((tramo) => (tramo.sectorId === id ? { ...tramo, sectorId: null } : tramo)))
      if (sectorId === id) setSectorId(sectores.find((sector) => sector.id !== id)?.id ?? '')
      setAviso('')
    } catch (causa: unknown) {
      setAviso(causa instanceof Error ? causa.message : 'No se ha podido quitar el sector.')
    }
  }

  async function marcarTramo() {
    const titulo = nombre.trim()
    if (!titulo || !sectorId || !punto) return
    try {
      const tramo = await crearTramo(campeonatoId, {
        nombre: titulo,
        sectorId,
        latitud: punto.latitud,
        longitud: punto.longitud,
      })
      setTramos((actual) => [...actual, tramo])
      setNombre('')
      setPunto(null)
      setAviso('')
    } catch (causa: unknown) {
      setAviso(causa instanceof Error ? causa.message : 'No se ha podido marcar el tramo.')
    }
  }

  async function quitar(id: string) {
    try {
      await quitarTramo(campeonatoId, id)
      setTramos((actual) => actual.filter((tramo) => tramo.id !== id))
      if (seleccionado === id) setSeleccionado(null)
      setAviso('')
    } catch (causa: unknown) {
      setAviso(causa instanceof Error ? causa.message : 'No se ha podido quitar el tramo.')
    }
  }

  async function mover(id: string, nuevoSectorId: string) {
    try {
      const actualizado = await moverTramo(campeonatoId, id, nuevoSectorId || null)
      setTramos((actual) => actual.map((tramo) => (tramo.id === id ? actualizado : tramo)))
      setAviso('')
    } catch (causa: unknown) {
      setAviso(causa instanceof Error ? causa.message : 'No se ha podido mover el tramo.')
    }
  }

  function alPulsarMapa(evento: google.maps.MapMouseEvent) {
    if (!evento.latLng) return
    setPunto({ latitud: evento.latLng.lat(), longitud: evento.latLng.lng() })
    setSeleccionado(null)
  }

  return (
    <div className="escenario">
      <div className="escenario__mapa">
        {!apiKey && (
          <p className="escenario__aviso">
            Añade la clave de Google Maps en la variable
            GOOGLE_MAPS_API_KEY para ver el escenario y marcar tramos.
          </p>
        )}
        {apiKey && loadError && (
          <p className="escenario__aviso">No se ha podido cargar Google Maps.</p>
        )}
        {apiKey && !isLoaded && !loadError && (
          <p className="escenario__aviso">Cargando el mapa…</p>
        )}
        {aviso && <p className="escenario__aviso">{aviso}</p>}
        {apiKey && isLoaded && listo && (
          <GoogleMap
            mapContainerClassName="escenario__lienzo"
            center={vista.center}
            zoom={vista.zoom}
            onLoad={(mapa) => encuadrarTramos(mapa, tramos)}
            onClick={alPulsarMapa}
            options={{
              mapTypeId: 'hybrid',
              streetViewControl: false,
              fullscreenControl: false,
              clickableIcons: false,
            }}
          >
            {tramos.map((tramo) => (
              <Marker
                key={tramo.id}
                position={{ lat: tramo.latitud, lng: tramo.longitud }}
                label={tramo.id === seleccionado ? tramo.nombre : undefined}
                zIndex={tramo.id === seleccionado ? 2 : 1}
                onClick={() => setSeleccionado(tramo.id)}
              />
            ))}
            {punto && (
              <Marker
                position={{ lat: punto.latitud, lng: punto.longitud }}
                zIndex={3}
              />
            )}
          </GoogleMap>
        )}
      </div>

      <section className="escenario__panel escenario__alta">
        <div>
          <h2>Nuevo tramo</h2>
          <p>Haz clic en el mapa para colocar el marcador. La localización se guarda al marcar el tramo.</p>
          {punto && (
            <p className="escenario__coords">
              Latitud {punto.latitud.toFixed(6)} · Longitud {punto.longitud.toFixed(6)}
            </p>
          )}
        </div>
        <div className="escenario__formulario">
          <label className="escenario__campo">
            Nuevo sector
            <input
              value={nombreSector}
              onChange={(event) => setNombreSector(event.target.value)}
              placeholder="Sector A"
            />
          </label>
          <button type="button" onClick={anadirSector} disabled={!nombreSector.trim()}>
            Añadir sector
          </button>
          <label className="escenario__campo">
            Nombre del tramo
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tramo norte"
            />
          </label>
          <label className="escenario__campo">
            Sector
            <select value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
              <option value="">Sin sector</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={marcarTramo}
            disabled={!apiKey || !isLoaded || !nombre.trim() || !sectorId || !punto}
          >
            Marcar tramo
          </button>
        </div>
      </section>

      <section className="escenario__panel escenario__catalogo">
        <header className="escenario__catalogo-cabecera">
          <h2>
            Tramos de {campeonato?.nombre ?? 'este campeonato'}
            <span>{grupos.total}</span>
          </h2>
          <label className="escenario__campo">
            Buscar
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre del tramo"
            />
          </label>
        </header>
        <div className="escenario__filtros" role="tablist" aria-label="Filtrar por sector">
          <button
            type="button"
            className={sectorVisible === 'todos' ? 'is-active' : undefined}
            onClick={() => setSectorVisible('todos')}
          >
            Todos
          </button>
          {sectores.map((sector) => (
            <button
              key={sector.id}
              type="button"
              className={sectorVisible === sector.id ? 'is-active' : undefined}
              onClick={() => setSectorVisible(sector.id)}
            >
              <i style={{ background: colorDeSector(sectores, sector.id) }} />
              {sector.nombre}
            </button>
          ))}
          <button
            type="button"
            className={sectorVisible === 'sin-sector' ? 'is-active' : undefined}
            onClick={() => setSectorVisible('sin-sector')}
          >
            Sin sector
          </button>
        </div>
        <div className="escenario__scroll">
          {tramos.length === 0 && sectores.length === 0 && (
            <p className="escenario__vacio">Todavía no hay sectores ni tramos.</p>
          )}
          {grupos.total === 0 && (tramos.length > 0 || busqueda) && (
            <p className="escenario__vacio">Ningún tramo coincide con el filtro.</p>
          )}
          {grupos.porSector.map(({ sector, tramos: delSector }) => (
            <section key={sector.id} className="escenario__grupo">
              <header>
                <h3>
                  <i style={{ background: colorDeSector(sectores, sector.id) }} />
                  {sector.nombre}
                  <span>{delSector.length}</span>
                </h3>
                <button type="button" className="escenario__quitar-sector" onClick={() => quitarSectorDe(sector.id)}>
                  Quitar sector
                </button>
              </header>
              <ListaTramos
                tramos={delSector}
                sectores={sectores}
                seleccionado={seleccionado}
                onSeleccionar={setSeleccionado}
                onMover={mover}
                onQuitar={quitar}
              />
            </section>
          ))}
          {grupos.sueltos.length > 0 && (
            <section className="escenario__grupo">
              <header>
                <h3>
                  Sin sector
                  <span>{grupos.sueltos.length}</span>
                </h3>
              </header>
              <ListaTramos
                tramos={grupos.sueltos}
                sectores={sectores}
                seleccionado={seleccionado}
                onSeleccionar={setSeleccionado}
                onMover={mover}
                onQuitar={quitar}
              />
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

function ListaTramos({
  tramos,
  sectores,
  seleccionado,
  onSeleccionar,
  onMover,
  onQuitar,
}: {
  tramos: Tramo[]
  sectores: Sector[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  onMover: (id: string, sectorId: string) => void
  onQuitar: (id: string) => void
}) {
  if (tramos.length === 0) {
    return <p className="escenario__vacio">Sin tramos en este sector.</p>
  }

  return (
    <ul className="escenario__lista">
      {tramos.map((tramo) => (
        <li key={tramo.id}>
          <button
            type="button"
            className={tramo.id === seleccionado ? 'is-active' : undefined}
            onClick={() => onSeleccionar(tramo.id)}
          >
            {tramo.nombre}
            <span>
              {tramo.latitud.toFixed(5)}, {tramo.longitud.toFixed(5)}
            </span>
          </button>
          <select
            aria-label={`Sector de ${tramo.nombre}`}
            value={tramo.sectorId ?? ''}
            onChange={(event) => onMover(tramo.id, event.target.value)}
          >
            <option value="">Sin sector</option>
            {sectores.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nombre}
              </option>
            ))}
          </select>
          <button type="button" className="escenario__borrar" onClick={() => onQuitar(tramo.id)}>
            Quitar
          </button>
        </li>
      ))}
    </ul>
  )
}
