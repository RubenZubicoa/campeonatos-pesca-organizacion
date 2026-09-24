import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  asignarManga,
  asignarMangaPermitiendoRepeticion,
  loadMangas,
  saveMangas,
  type Manga,
  type RangoHorario,
} from '../data/mangas'
import { loadParticipantes } from '../data/participantes'
import { loadEscenario } from '../data/tramos'
import './Mangas.css'

const vacio = { nombre: '', inicio1: '', fin1: '', inicio2: '', fin2: '' }

export function Mangas() {
  const { campeonatoId = '' } = useParams()
  const [mangas, setMangas] = useState<Manga[]>(() => loadMangas(campeonatoId))
  const [abierto, setAbierto] = useState(false)
  const [formulario, setFormulario] = useState(vacio)
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const participantes = loadParticipantes(campeonatoId)
  const escenario = loadEscenario(campeonatoId)

  function actualizar(campo: keyof typeof vacio, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function crear(evento: FormEvent) {
    evento.preventDefault()
    const nombre = formulario.nombre.trim()
    const rangos = [
      { inicio: formulario.inicio1, fin: formulario.fin1 },
      { inicio: formulario.inicio2, fin: formulario.fin2 },
    ] as const
    if (!nombre || rangos.some((rango) => !rango.inicio || !rango.fin)) {
      setError('Indica el nombre y las dos franjas horarias.')
      return
    }
    if (rangos.some((rango) => rango.inicio >= rango.fin)) {
      setError('En cada franja, la hora de inicio tiene que ser anterior a la de fin.')
      return
    }

    const reparto = asignarManga(participantes, escenario.sectores, escenario.tramos, mangas)
    if (!reparto.ok) {
      setConfirmar(true)
      setError('')
      return
    }

    guardar(nombre, [rangos[0], rangos[1]], reparto.asignaciones)
  }

  function continuar() {
    const nombre = formulario.nombre.trim()
    const reparto = asignarMangaPermitiendoRepeticion(
      participantes,
      escenario.sectores,
      escenario.tramos,
      mangas,
    )
    if (!reparto.ok) {
      setConfirmar(false)
      setError(reparto.error)
      return
    }
    guardar(nombre, [
      { inicio: formulario.inicio1, fin: formulario.fin1 },
      { inicio: formulario.inicio2, fin: formulario.fin2 },
    ], reparto.asignaciones)
  }

  function guardar(
    nombre: string,
    rangos: [RangoHorario, RangoHorario],
    asignaciones: Manga['asignaciones'],
  ) {
    const siguiente = [
      ...mangas,
      { id: crypto.randomUUID(), nombre, rangos, asignaciones, visibleParaParticipantes: false },
    ]
    setMangas(siguiente)
    saveMangas(campeonatoId, siguiente)
    setFormulario(vacio)
    setAbierto(false)
    setConfirmar(false)
    setError('')
  }

  function cambiarVisibilidad(id: string) {
    const siguiente = mangas.map((manga) =>
      manga.id === id
        ? { ...manga, visibleParaParticipantes: !manga.visibleParaParticipantes }
        : manga,
    )
    setMangas(siguiente)
    saveMangas(campeonatoId, siguiente)
  }

  function quitarUltima() {
    const siguiente = mangas.slice(0, -1)
    setMangas(siguiente)
    saveMangas(campeonatoId, siguiente)
  }

  return (
    <div className="mangas">
      <div className="mangas__cabecera">
        <p className="mangas__nota">
          Cada manga tiene dos franjas: la mitad de los participantes pesca en la primera y la otra mitad en la segunda.
        </p>
        <button type="button" onClick={() => { setAbierto((valor) => !valor); setError(''); setConfirmar(false) }}>
          {abierto ? 'Cerrar' : 'Crear manga'}
        </button>
      </div>

      {abierto && (
        <form className="mangas__form" onSubmit={crear}>
          <label>
            Nombre
            <input value={formulario.nombre} onChange={(event) => actualizar('nombre', event.target.value)} />
          </label>
          <fieldset>
            <legend>Primera mitad</legend>
            <label>
              Desde
              <input type="time" value={formulario.inicio1} onChange={(event) => actualizar('inicio1', event.target.value)} />
            </label>
            <label>
              Hasta
              <input type="time" value={formulario.fin1} onChange={(event) => actualizar('fin1', event.target.value)} />
            </label>
          </fieldset>
          <fieldset>
            <legend>Segunda mitad</legend>
            <label>
              Desde
              <input type="time" value={formulario.inicio2} onChange={(event) => actualizar('inicio2', event.target.value)} />
            </label>
            <label>
              Hasta
              <input type="time" value={formulario.fin2} onChange={(event) => actualizar('fin2', event.target.value)} />
            </label>
          </fieldset>
          {error && <p className="mangas__error">{error}</p>}
          {confirmar && (
            <div className="mangas__confirma">
              <p>¿Estás seguro que deseas continuar?</p>
              <button type="button" onClick={continuar}>
                Continuar
              </button>
              <button type="button" className="mangas__quitar" onClick={() => setConfirmar(false)}>
                Cancelar
              </button>
            </div>
          )}
          {!confirmar && <button type="submit">Guardar manga</button>}
        </form>
      )}

      {mangas.length === 0 ? (
        <p className="mangas__vacio">Todavía no hay mangas en este campeonato.</p>
      ) : (
        <ul className="mangas__lista">
          {mangas.map((manga, indice) => (
            <li key={manga.id}>
              <header>
                <h2>{manga.nombre}</h2>
                <p>
                  {textoRango(manga.rangos[0])}
                  <span> · </span>
                  {textoRango(manga.rangos[1])}
                </p>
                <button
                  type="button"
                  className={manga.visibleParaParticipantes ? 'mangas__visible' : undefined}
                  onClick={() => cambiarVisibilidad(manga.id)}
                >
                  {manga.visibleParaParticipantes ? 'Ocultar a los participantes' : 'Mostrar a los participantes'}
                </button>
                {indice === mangas.length - 1 && (
                  <button type="button" className="mangas__quitar" onClick={quitarUltima}>
                    Quitar
                  </button>
                )}
              </header>
              {[1, 2].map((turno) => (
                <div key={turno}>
                  <h3>
                    {turno === 1 ? 'Primera mitad' : 'Segunda mitad'} · {textoRango(manga.rangos[turno - 1])}
                  </h3>
                  <ul>
                    {manga.asignaciones
                      .filter((asignacion) => asignacion.turno === turno)
                      .map((asignacion) => {
                        const participante = participantes.find((item) => item.id === asignacion.participanteId)
                        const tramo = escenario.tramos.find((item) => item.id === asignacion.tramoId)
                        const sector = escenario.sectores.find((item) => item.id === asignacion.sectorId)
                        return (
                          <li key={asignacion.participanteId}>
                            <strong>{participante?.nombre ?? 'Participante'}</strong>
                            <span>
                              {sector?.nombre ?? 'Sector'} · {tramo?.nombre ?? 'Tramo'}
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function textoRango(rango: { inicio: string; fin: string }) {
  return `${rango.inicio}–${rango.fin}`
}
