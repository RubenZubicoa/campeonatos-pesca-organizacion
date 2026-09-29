import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  actualizarCaptura,
  crearCaptura,
  listarCapturas,
  listarMangas,
  listarParticipantes,
  quitarCaptura,
} from '../api'
import { capturasDe, type Captura } from '../data/capturas'
import type { Manga } from '../data/mangas'
import type { Participante } from '../data/participantes'
import './Clasificacion.css'

const vacio = { longitud: '', fechaHora: '' }

export function DetalleCapturas() {
  const { campeonatoId = '', mangaId = '', participanteId = '' } = useParams()
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [mangas, setMangas] = useState<Manga[]>([])
  const [capturas, setCapturas] = useState<Captura[]>([])
  const [nueva, setNueva] = useState(vacio)
  const [error, setError] = useState('')
  const participante = participantes.find((item) => item.id === participanteId)
  const manga = mangas.find((item) => item.id === mangaId)
  const delParticipante = capturasDe(capturas, participanteId, mangaId)

  useEffect(() => {
    let activo = true
    Promise.all([
      listarParticipantes(campeonatoId),
      listarMangas(campeonatoId),
      listarCapturas(campeonatoId, { participanteId, mangaId }),
    ])
      .then(([inscritos, mangasCargadas, capturasCargadas]) => {
        if (!activo) return
        setParticipantes(inscritos)
        setMangas(mangasCargadas)
        setCapturas(capturasCargadas)
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : 'No se han podido cargar las capturas.')
      })
    return () => {
      activo = false
    }
  }, [campeonatoId, participanteId, mangaId])

  async function registrar(evento: FormEvent) {
    evento.preventDefault()
    const longitud = Number(nueva.longitud)
    if (!nueva.fechaHora || !Number.isFinite(longitud) || longitud <= 0) {
      setError('Indica una longitud en centímetros y la fecha y hora.')
      return
    }
    try {
      const creada = await crearCaptura(campeonatoId, {
        participanteId,
        mangaId,
        longitud,
        fechaHora: nueva.fechaHora,
      })
      setCapturas((actual) => [...actual, creada])
      setNueva(vacio)
      setError('')
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido registrar la captura.')
    }
  }

  async function actualizar(id: string, cambios: Partial<Pick<Captura, 'longitud' | 'fechaHora' | 'mangaId'>>) {
    if (cambios.longitud !== undefined && (!Number.isFinite(cambios.longitud) || cambios.longitud <= 0)) return
    try {
      const actualizada = await actualizarCaptura(campeonatoId, id, cambios)
      setCapturas((actual) => actual.map((captura) => (captura.id === id ? actualizada : captura)))
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido actualizar la captura.')
    }
  }

  async function quitar(id: string) {
    try {
      await quitarCaptura(campeonatoId, id)
      setCapturas((actual) => actual.filter((captura) => captura.id !== id))
    } catch (causa: unknown) {
      setError(causa instanceof Error ? causa.message : 'No se ha podido quitar la captura.')
    }
  }

  return (
    <section className="clasificacion__bloque">
      <Link className="clasificacion__volver" to={`/campeonatos/${campeonatoId}/clasificacion`}>
        Volver a la clasificación
      </Link>
      <h2>Capturas de {participante?.nombre ?? 'participante'}</h2>
      <p>{manga?.nombre ?? 'Manga'}</p>

      <form className="capturas__alta" onSubmit={registrar}>
        <label>
          Longitud (cm)
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={nueva.longitud}
            onChange={(event) => setNueva((actual) => ({ ...actual, longitud: event.target.value }))}
          />
        </label>
        <label>
          Fecha y hora
          <input
            type="datetime-local"
            value={nueva.fechaHora}
            onChange={(event) => setNueva((actual) => ({ ...actual, fechaHora: event.target.value }))}
          />
        </label>
        <label>
          Manga
          <input value={manga?.nombre ?? ''} readOnly />
        </label>
        <button type="submit">Registrar captura</button>
      </form>
      {error && <p className="capturas__error">{error}</p>}

      {delParticipante.length === 0 ? (
        <p>Todavía no hay capturas en esta manga.</p>
      ) : (
        <ul className="capturas__lista">
          {delParticipante.map((captura) => (
            <li key={captura.id}>
              <label>
                Longitud (cm)
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={captura.longitud}
                  onChange={(event) =>
                    actualizar(captura.id, { longitud: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Fecha y hora
                <input
                  type="datetime-local"
                  value={captura.fechaHora}
                  onChange={(event) => actualizar(captura.id, { fechaHora: event.target.value })}
                />
              </label>
              <label>
                Manga
                <select
                  value={captura.mangaId}
                  onChange={(event) => actualizar(captura.id, { mangaId: event.target.value })}
                >
                  {mangas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => quitar(captura.id)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
