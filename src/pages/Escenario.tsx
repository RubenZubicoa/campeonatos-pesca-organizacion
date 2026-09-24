import { useMemo, useState } from 'react'
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api'
import { useParams } from 'react-router-dom'
import { getCampeonato } from '../data/campeonatos'
import {
  colorDeSector,
  loadEscenario,
  saveEscenario,
  type Sector,
  type Tramo,
} from '../data/tramos'
import './Escenario.css'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

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
  const campeonato = getCampeonato(campeonatoId)
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'thelake-google-maps',
    googleMapsApiKey: apiKey,
  })
  const inicial = loadEscenario(campeonatoId)
  const [vista] = useState(() => vistaInicial(inicial.tramos))
  const [sectores, setSectores] = useState<Sector[]>(inicial.sectores)
  const [tramos, setTramos] = useState<Tramo[]>(inicial.tramos)
  const [nombreSector, setNombreSector] = useState('')
  const [nombre, setNombre] = useState('')
  const [sectorId, setSectorId] = useState(inicial.sectores[0]?.id ?? '')
  const [punto, setPunto] = useState<{ latitud: number; longitud: number } | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [sectorVisible, setSectorVisible] = useState('todos')

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

  function persist(nextSectores: Sector[], nextTramos: Tramo[]) {
    setSectores(nextSectores)
    setTramos(nextTramos)
    saveEscenario(campeonatoId, { sectores: nextSectores, tramos: nextTramos })
  }

  function anadirSector() {
    const titulo = nombreSector.trim()
    if (!titulo) return
    const sector = { id: crypto.randomUUID(), nombre: titulo }
    persist([...sectores, sector], tramos)
    setNombreSector('')
    if (!sectorId) setSectorId(sector.id)
  }

  function quitarSector(id: string) {
    persist(
      sectores.filter((sector) => sector.id !== id),
      tramos.map((tramo) => (tramo.sectorId === id ? { ...tramo, sectorId: null } : tramo)),
    )
    if (sectorId === id) setSectorId(sectores.find((sector) => sector.id !== id)?.id ?? '')
  }

  function marcarTramo() {
    const titulo = nombre.trim()
    if (!titulo || !sectorId || !punto) return
    persist(sectores, [
      ...tramos,
      {
        id: crypto.randomUUID(),
        nombre: titulo,
        sectorId,
        latitud: punto.latitud,
        longitud: punto.longitud,
      },
    ])
    setNombre('')
    setPunto(null)
  }

  function quitar(id: string) {
    persist(sectores, tramos.filter((tramo) => tramo.id !== id))
    if (seleccionado === id) setSeleccionado(null)
  }

  function mover(id: string, nuevoSectorId: string) {
    persist(
      sectores,
      tramos.map((tramo) => (tramo.id === id ? { ...tramo, sectorId: nuevoSectorId || null } : tramo)),
    )
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
            VITE_GOOGLE_MAPS_API_KEY para ver el escenario y marcar tramos.
          </p>
        )}
        {apiKey && loadError && (
          <p className="escenario__aviso">No se ha podido cargar Google Maps.</p>
        )}
        {apiKey && !isLoaded && !loadError && (
          <p className="escenario__aviso">Cargando el mapa…</p>
        )}
        {apiKey && isLoaded && (
          <GoogleMap
            mapContainerClassName="escenario__lienzo"
            center={vista.center}
            zoom={vista.zoom}
            onLoad={(mapa) => encuadrarTramos(mapa, inicial.tramos)}
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
                <button type="button" className="escenario__quitar-sector" onClick={() => quitarSector(sector.id)}>
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
