import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  ApiError,
  actualizarControl,
  cambiarVisibilidadManga,
  crearManga,
  editarAsignacionManga,
  generarControles,
  listarControles,
  listarMangas,
  listarParticipantes,
  obtenerEscenario,
  quitarManga,
  type Control,
} from '../api'
import type { Asignacion, Manga, RangoHorario } from '../data/mangas'
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
  const [controles, setControles] = useState<Control[]>([])
  const [abierto, setAbierto] = useState(false)
  const [formulario, setFormulario] = useState(vacio)
  const [error, setError] = useState('')
  const [confirmar, setConfirmar] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([
      listarMangas(campeonatoId),
      listarParticipantes(campeonatoId),
      obtenerEscenario(campeonatoId),
      listarControles(campeonatoId),
    ])
      .then(([mangasCargadas, inscritos, escenario, controlesCargados]) => {
        if (!activo) return
        setMangas(mangasCargadas)
        setParticipantes(inscritos)
        setSectores(escenario.sectores)
        setTramos(escenario.tramos)
        setControles(controlesCargados)
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

  async function generar(mangaId: string) {
    try {
      const generados = await generarControles(campeonatoId, mangaId)
      setControles((actual) => [...actual.filter((control) => control.mangaId !== mangaId), ...generados])
      setError('')
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se han podido generar los controles.')
    }
  }

  async function editarControl(control: Control, cambios: Partial<Pick<Control, 'control' | 'tramo'>>) {
    try {
      const actualizado = await actualizarControl(campeonatoId, control.id, cambios)
      setControles((actual) => actual.map((item) => (item.id === control.id ? actualizado : item)))
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido guardar el control.')
    }
  }

  async function guardarAsignacion(mangaId: string, participanteId: string, tramoId: string, turno: 1 | 2) {
    try {
      const actualizada = await editarAsignacionManga(campeonatoId, mangaId, { participanteId, tramoId, turno })
      setMangas((actual) => actual.map((item) => (item.id === mangaId ? actualizada : item)))
      setControles((actual) => actual.filter((control) => control.mangaId !== mangaId))
      setError('')
      return true
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido modificar el reparto.')
      return false
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
              {(() => {
                const controlesManga = controles.filter((control) => control.mangaId === manga.id)
                const turnoPesca = new Map(manga.asignaciones.map((asignacion) => [asignacion.participanteId, asignacion.turno]))
                return (
                  <>
                    {controlesManga.length === 0 && (
                      <button type="button" className="mangas__secundario" onClick={() => generar(manga.id)}>
                        Generar controles
                      </button>
                    )}
                    {[1, 2].map((turno) => (
                      <div key={turno}>
                        <h3>
                          {turno === 1 ? 'Primera mitad' : 'Segunda mitad'} · {textoRango(manga.rangos[turno - 1])}
                        </h3>
                        <ul className="mangas__reparto">
                          {manga.asignaciones
                            .filter((asignacion) => asignacion.turno === turno)
                            .map((asignacion) => (
                              <FilaAsignacion
                                key={asignacion.participanteId}
                                asignacion={asignacion}
                                nombre={participantes.find((item) => item.id === asignacion.participanteId)?.nombre ?? 'Participante'}
                                sector={sectores.find((item) => item.id === asignacion.sectorId)?.nombre ?? 'Sector'}
                                tramo={tramos.find((item) => item.id === asignacion.tramoId)?.nombre ?? 'Tramo'}
                                manga={manga}
                                tramos={tramos}
                                sectores={sectores}
                                onGuardar={(participanteId, tramoId, hora) => guardarAsignacion(manga.id, participanteId, tramoId, hora)}
                              />
                            ))}
                        </ul>
                        {controlesManga.length > 0 && (
                          <ControlesManga
                            controles={controlesDeHora(controlesManga, turno, turnoPesca)}
                            participantes={participantes}
                            tramos={tramos}
                            nombresControl={nombresPescados(manga.asignaciones, turno, tramos)}
                            onEditar={editarControl}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )
              })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilaAsignacion({
  asignacion,
  nombre,
  sector,
  tramo,
  manga,
  tramos,
  sectores,
  onGuardar,
}: {
  asignacion: Asignacion
  nombre: string
  sector: string
  tramo: string
  manga: Manga
  tramos: Tramo[]
  sectores: Sector[]
  onGuardar: (participanteId: string, tramoId: string, turno: 1 | 2) => Promise<boolean>
}) {
  const [editando, setEditando] = useState(false)
  const [turno, setTurno] = useState<1 | 2>(asignacion.turno)
  const [tramoId, setTramoId] = useState(asignacion.tramoId)
  const [guardando, setGuardando] = useState(false)
  const opciones = tramosOrdenados(tramos, sectores)

  function empezar() {
    setTurno(asignacion.turno)
    setTramoId(asignacion.tramoId)
    setEditando(true)
  }

  function cambiarTurno(hora: 1 | 2) {
    setTurno(hora)
    if (tramoOcupado(manga, hora, asignacion.participanteId, tramoId)) {
      const libre = opciones.find((opcion) => !tramoOcupado(manga, hora, asignacion.participanteId, opcion.id))
      if (libre) setTramoId(libre.id)
    }
  }

  async function guardar() {
    if (turno === asignacion.turno && tramoId === asignacion.tramoId) {
      setEditando(false)
      return
    }
    setGuardando(true)
    const guardado = await onGuardar(asignacion.participanteId, tramoId, turno)
    setGuardando(false)
    if (guardado) setEditando(false)
  }

  return (
    <li className={editando ? 'is-editing' : undefined}>
      <strong>{nombre}</strong>
      {editando ? (
        <>
          <label>
            Hora
            <select value={turno} onChange={(event) => cambiarTurno(event.target.value === '2' ? 2 : 1)}>
              <option value={1}>Primera mitad · {textoRango(manga.rangos[0])}</option>
              <option value={2}>Segunda mitad · {textoRango(manga.rangos[1])}</option>
            </select>
          </label>
          <label>
            Tramo
            <select value={tramoId} onChange={(event) => setTramoId(event.target.value)}>
              {opciones.map((opcion) => (
                <option
                  key={opcion.id}
                  value={opcion.id}
                  disabled={tramoOcupado(manga, turno, asignacion.participanteId, opcion.id)}
                >
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <div className="mangas__fila-acciones">
            <button type="button" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="mangas__secundario" onClick={() => setEditando(false)} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <span>
            {sector} · {tramo}
          </span>
          <button type="button" className="mangas__modificar" onClick={empezar}>
            Modificar
          </button>
        </>
      )}
    </li>
  )
}

function tramosOrdenados(tramos: Tramo[], sectores: Sector[]) {
  return [...tramos]
    .map((tramo) => ({
      id: tramo.id,
      etiqueta: `${sectores.find((sector) => sector.id === tramo.sectorId)?.nombre ?? 'Sin sector'} · ${tramo.nombre}`,
      ordenSector: sectores.find((sector) => sector.id === tramo.sectorId)?.nombre ?? 'Sin sector',
      ordenTramo: tramo.nombre,
    }))
    .sort(
      (a, b) =>
        a.ordenSector.localeCompare(b.ordenSector, 'es') || a.ordenTramo.localeCompare(b.ordenTramo, 'es', { numeric: true }),
    )
}

function tramoOcupado(manga: Manga, turno: 1 | 2, participanteId: string, tramoId: string) {
  return manga.asignaciones.some(
    (asignacion) =>
      asignacion.participanteId !== participanteId && asignacion.turno === turno && asignacion.tramoId === tramoId,
  )
}

function textoRango(rango: { inicio: string; fin: string } | undefined) {
  if (!rango) return ''
  return `${rango.inicio}–${rango.fin}`
}

function horaDeControl(turnoPesca: 1 | 2 | undefined): 1 | 2 | null {
  if (turnoPesca === 1) return 2
  if (turnoPesca === 2) return 1
  return null
}

function controlesDeHora(controles: Control[], turno: 1 | 2, turnoPesca: Map<string, 1 | 2>) {
  return controles.filter((control) => {
    const hora = horaDeControl(turnoPesca.get(control.participanteId))
    return hora === turno || (hora === null && turno === 1)
  })
}

function nombresPescados(
  asignaciones: { tramoId: string; turno: 1 | 2 }[],
  turno: 1 | 2,
  tramos: Tramo[],
) {
  const ids = new Set(asignaciones.filter((asignacion) => asignacion.turno === turno).map((asignacion) => asignacion.tramoId))
  return [...new Set(tramos.filter((tramo) => ids.has(tramo.id)).map((tramo) => tramo.nombre))].sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true }),
  )
}

function ControlesManga({
  controles,
  participantes,
  tramos,
  nombresControl,
  onEditar,
}: {
  controles: Control[]
  participantes: Participante[]
  tramos: Tramo[]
  nombresControl: string[]
  onEditar: (control: Control, cambios: Partial<Pick<Control, 'control' | 'tramo'>>) => void
}) {
  const nombres = [...new Set(tramos.map((tramo) => tramo.nombre))].sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true }),
  )

  return (
    <div className="mangas__controles">
      <header>
        <h3>Controles de esta hora</h3>
        <p>Quien pesca en la otra franja controla un tramo que se pesca ahora.</p>
      </header>
      {controles.length === 0 ? (
        <p className="mangas__vacio">Nadie controla en esta franja.</p>
      ) : (
        <ul>
          {controles.map((control) => (
            <FilaControl
              key={control.id}
              control={control}
              nombre={participantes.find((item) => item.id === control.participanteId)?.nombre ?? 'Participante'}
              nombres={nombres}
              nombresControl={nombresControl}
              onEditar={onEditar}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilaControl({
  control,
  nombre,
  nombres,
  nombresControl,
  onEditar,
}: {
  control: Control
  nombre: string
  nombres: string[]
  nombresControl: string[]
  onEditar: (control: Control, cambios: Partial<Pick<Control, 'control' | 'tramo'>>) => void
}) {
  const [editando, setEditando] = useState(false)
  const [tramo, setTramo] = useState(control.tramo)
  const [controlado, setControlado] = useState(control.control)

  function empezar() {
    setTramo(control.tramo)
    setControlado(nombresControl.includes(control.control) ? control.control : (nombresControl[0] ?? control.control))
    setEditando(true)
  }

  function guardar() {
    const cambios: Partial<Pick<Control, 'control' | 'tramo'>> = {}
    if (tramo !== control.tramo) cambios.tramo = tramo
    if (controlado !== control.control) cambios.control = controlado
    if (Object.keys(cambios).length > 0) onEditar(control, cambios)
    setEditando(false)
  }

  return (
    <li className={editando ? 'is-editing' : undefined}>
      <strong>{nombre}</strong>
      {editando ? (
        <>
          <label>
            Pesca
            <select value={tramo} onChange={(event) => setTramo(event.target.value)}>
              {opciones(nombres, tramo)}
            </select>
          </label>
          <label>
            Controla
            <select value={controlado} onChange={(event) => setControlado(event.target.value)}>
              {opciones(nombresControl, controlado)}
            </select>
          </label>
          <div className="mangas__fila-acciones">
            <button type="button" onClick={guardar}>
              Guardar
            </button>
            <button type="button" className="mangas__secundario" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <span>
            <em>Pesca</em>
            {control.tramo}
          </span>
          <span>
            <em>Controla</em>
            {control.control}
          </span>
          <button type="button" className="mangas__modificar" onClick={empezar}>
            Modificar
          </button>
        </>
      )}
    </li>
  )
}

function opciones(nombres: string[], actual: string) {
  const lista = nombres.includes(actual) ? nombres : [actual, ...nombres]
  return lista.map((nombre) => (
    <option key={nombre} value={nombre}>
      {nombre}
    </option>
  ))
}
