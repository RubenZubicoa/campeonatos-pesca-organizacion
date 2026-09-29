import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  ApiError,
  cambiarVisibilidadManga,
  crearManga,
  listarMangas,
  listarParticipantes,
  obtenerEscenario,
  quitarManga,
} from '../api'
import type { Manga, RangoHorario } from '../data/mangas'
import type { Participante } from '../data/participantes'
import type { Sector, Tramo } from '../data/tramos'
import './Mangas.css'

const vacio = { nombre: '', inicio1: '', fin1: '', inicio2: '', fin2: '' }

export function Mangas() {
  const { campeonatoId = '' } = useParams()
  const [mangas, setMangas] = useState<Manga[]>([])
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [sectores, setSectores] = useState<Sector[]>([])
  const [tramos, setTramos] = useState<Tramo[]>([])
  const [abierto, setAbierto] = useState(false)
  const [formulario, setFormulario] = useState(vacio)
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([listarMangas(campeonatoId), listarParticipantes(campeonatoId), obtenerEscenario(campeonatoId)])
      .then(([mangasCargadas, inscritos, escenario]) => {
        if (!activo) return
        setMangas(mangasCargadas)
        setParticipantes(inscritos)
        setSectores(escenario.sectores)
        setTramos(escenario.tramos)
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : 'No se han podido cargar las mangas.')
      })
    return () => {
      activo = false
    }
  }, [campeonatoId])

  function actualizar(campo: keyof typeof vacio, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function rangosDelFormulario(): [RangoHorario, RangoHorario] | null {
    const rangos: [RangoHorario, RangoHorario] = [
      { inicio: formulario.inicio1, fin: formulario.fin1 },
      { inicio: formulario.inicio2, fin: formulario.fin2 },
    ]
    if (!formulario.nombre.trim() || rangos.some((rango) => !rango.inicio || !rango.fin)) {
      setError('Indica el nombre y las dos franjas horarias.')
      return null
    }
    if (rangos.some((rango) => rango.inicio >= rango.fin)) {
      setError('En cada franja, la hora de inicio tiene que ser anterior a la de fin.')
      return null
    }
    return rangos
  }

  async function crear(evento: FormEvent) {
    evento.preventDefault()
    const rangos = rangosDelFormulario()
    if (!rangos) return
    await guardar(formulario.nombre.trim(), rangos, false)
  }

  async function continuar() {
    const rangos = rangosDelFormulario()
    if (!rangos) return
    await guardar(formulario.nombre.trim(), rangos, true)
  }

  async function guardar(nombre: string, rangos: [RangoHorario, RangoHorario], permitirRepeticion: boolean) {
    try {
      const manga = await crearManga(campeonatoId, { nombre, rangos, permitirRepeticion })
      setMangas((actual) => [...actual, manga])
      setFormulario(vacio)
      setAbierto(false)
      setConfirmar(false)
      setError('')
    } catch (causa: unknown) {
      if (causa instanceof ApiError && causa.requiereConfirmacion) {
        setConfirmar(true)
        setError('')
        return
      }
      setConfirmar(false)
      setError(causa instanceof Error ? causa.message : 'No se ha podido guardar la manga.')
    }
  }

  async function cambiarVisibilidad(id: string) {
    const manga = mangas.find((item) => item.id === id)
    if (!manga) return
    try {
      const actualizada = await cambiarVisibilidadManga(campeonatoId, id, !manga.visibleParaParticipantes)
      setMangas((actual) => actual.map((item) => (item.id === id ? actualizada : item)))
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido cambiar la visibilidad.')
    }
  }

  async function quitarUltima() {
    const ultima = mangas.at(-1)
    if (!ultima) return
    try {
      await quitarManga(campeonatoId, ultima.id)
      setMangas((actual) => actual.slice(0, -1))
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido quitar la manga.')
    }
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

      {!abierto && error && <p className="mangas__error">{error}</p>}

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
                        const tramo = tramos.find((item) => item.id === asignacion.tramoId)
                        const sector = sectores.find((item) => item.id === asignacion.sectorId)
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

function textoRango(rango: { inicio: string; fin: string } | undefined) {
  if (!rango) return ''
  return `${rango.inicio}–${rango.fin}`
}
