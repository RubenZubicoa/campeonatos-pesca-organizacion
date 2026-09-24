import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { getCampeonato } from '../data/campeonatos'
import {
  crearIdAcceso,
  dniValido,
  loadParticipantes,
  normalizarDni,
  saveParticipantes,
  type Participante,
} from '../data/participantes'
import './Participantes.css'

const vacio = { nombre: '', fechaNacimiento: '', dni: '' }

function fechaLegible(iso: string) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

export function Participantes() {
  const { campeonatoId = '' } = useParams()
  const campeonato = getCampeonato(campeonatoId)
  const [participantes, setParticipantes] = useState<Participante[]>(() =>
    loadParticipantes(campeonatoId),
  )
  const [formulario, setFormulario] = useState(vacio)
  const [error, setError] = useState('')

  function actualizar(campo: keyof typeof vacio, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function alta(evento: FormEvent) {
    evento.preventDefault()
    const nombre = formulario.nombre.trim()
    const dni = normalizarDni(formulario.dni)
    const fecha = formulario.fechaNacimiento

    if (!nombre || !fecha || !dni) {
      setError('Completa nombre, fecha de nacimiento y DNI.')
      return
    }
    if (fecha > new Date().toISOString().slice(0, 10)) {
      setError('La fecha de nacimiento no puede ser posterior a hoy.')
      return
    }
    if (!dniValido(dni)) {
      setError('El DNI o NIE no es válido.')
      return
    }
    if (participantes.some((participante) => participante.dni === dni)) {
      setError('Ese DNI ya está inscrito en este campeonato.')
      return
    }

    const siguiente = [
      ...participantes,
      {
        id: crearIdAcceso(participantes.map((participante) => participante.id)),
        nombre,
        fechaNacimiento: fecha,
        dni,
      },
    ]
    setParticipantes(siguiente)
    saveParticipantes(campeonatoId, siguiente)
    setFormulario(vacio)
    setError('')
  }

  function quitar(id: string) {
    const siguiente = participantes.filter((participante) => participante.id !== id)
    setParticipantes(siguiente)
    saveParticipantes(campeonatoId, siguiente)
  }

  return (
    <div className="participantes">
      <form className="participantes__alta" onSubmit={alta}>
        <h2>Nuevo participante</h2>
        <p>
          La inscripción queda solo en {campeonato?.nombre ?? 'este campeonato'}.
          El identificador sirve para entrar en la app móvil.
        </p>
        <label>
          Nombre
          <input
            value={formulario.nombre}
            onChange={(event) => actualizar('nombre', event.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={formulario.fechaNacimiento}
            onChange={(event) => actualizar('fechaNacimiento', event.target.value)}
          />
        </label>
        <label>
          DNI
          <input
            value={formulario.dni}
            onChange={(event) => actualizar('dni', event.target.value)}
            placeholder="12345678Z"
            autoComplete="off"
          />
        </label>
        {error && <p className="participantes__error">{error}</p>}
        <button type="submit">Añadir participante</button>
      </form>

      <section className="participantes__lista">
        <h2>Inscritos</h2>
        {participantes.length === 0 ? (
          <p>Todavía no hay participantes en este campeonato.</p>
        ) : (
          <ul>
            {participantes.map((participante) => (
              <li key={participante.id}>
                <div>
                  <strong>{participante.nombre}</strong>
                  <span>
                    {fechaLegible(participante.fechaNacimiento)} · {participante.dni}
                  </span>
                </div>
                <p className="participantes__id">
                  <span>ID de acceso</span>
                  <code>{participante.id}</code>
                </p>
                <button type="button" onClick={() => quitar(participante.id)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
