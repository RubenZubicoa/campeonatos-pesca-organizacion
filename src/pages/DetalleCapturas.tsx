import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { capturasDe, loadCapturas, saveCapturas, type Captura } from '../data/capturas'
import { loadMangas } from '../data/mangas'
import { loadParticipantes } from '../data/participantes'
import './Clasificacion.css'

const vacio = { longitud: '', fechaHora: '' }

export function DetalleCapturas() {
  const { campeonatoId = '', mangaId = '', participanteId = '' } = useParams()
  const participantes = loadParticipantes(campeonatoId)
  const mangas = loadMangas(campeonatoId)
  const participante = participantes.find((item) => item.id === participanteId)
  const manga = mangas.find((item) => item.id === mangaId)
  const [capturas, setCapturas] = useState<Captura[]>(() => loadCapturas(campeonatoId))
  const [nueva, setNueva] = useState(vacio)
  const [error, setError] = useState('')
  const delParticipante = capturasDe(capturas, participanteId, mangaId)

  function persistir(siguiente: Captura[]) {
    setCapturas(siguiente)
    saveCapturas(campeonatoId, siguiente)
  }

  function registrar(evento: FormEvent) {
    evento.preventDefault()
    const longitud = Number(nueva.longitud)
    if (!nueva.fechaHora || !Number.isFinite(longitud) || longitud <= 0) {
      setError('Indica una longitud en centímetros y la fecha y hora.')
      return
    }
    persistir([
      ...capturas,
      {
        id: crypto.randomUUID(),
        participanteId,
        mangaId,
        longitud,
        fechaHora: nueva.fechaHora,
      },
    ])
    setNueva(vacio)
    setError('')
  }

  function actualizar(id: string, cambios: Partial<Pick<Captura, 'longitud' | 'fechaHora' | 'mangaId'>>) {
    persistir(capturas.map((captura) => (captura.id === id ? { ...captura, ...cambios } : captura)))
  }

  function quitar(id: string) {
    persistir(capturas.filter((captura) => captura.id !== id))
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
