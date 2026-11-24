import { useEffect, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { actualizarCampeonato } from '../api'
import type { Campeonato } from '../data/campeonatos'
import type { ContextoCampeonato } from './CampeonatoLayout'
import './Configuracion.css'

type Formulario = {
  nombre: string
  fecha: string
  lugar: string
  medidaMinima: string
  puntosT: string
  duos: boolean
}

export function Configuracion() {
  const { campeonato, setCampeonato } = useOutletContext<ContextoCampeonato>()
  const [formulario, setFormulario] = useState(() => desde(campeonato))
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setFormulario(desde(campeonato))
  }, [campeonato])

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setError('')
    setAviso('')
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const nombre = formulario.nombre.trim()
    const fecha = formulario.fecha.trim()
    const lugar = formulario.lugar.trim()
    const medidaMinima = numero(formulario.medidaMinima)
    const puntosT = numero(formulario.puntosT)

    if (!nombre || !fecha || !lugar) {
      setError('Completa nombre, fecha y lugar.')
      setAviso('')
      return
    }
    if (medidaMinima === null || medidaMinima < 0) {
      setError('La medida mínima tiene que ser un número igual o mayor que cero.')
      setAviso('')
      return
    }
    if (puntosT === null || puntosT < 0) {
      setError('Los puntos T tienen que ser un número igual o mayor que cero.')
      setAviso('')
      return
    }

    const cambios = {
      nombre,
      fecha,
      lugar,
      medidaMinima,
      puntosT,
      duos: formulario.duos,
    }
    if (iguales(campeonato, cambios)) {
      setError('')
      setAviso('No hay cambios.')
      return
    }

    setGuardando(true)
    try {
      const actualizado = await actualizarCampeonato(campeonato.id, cambios)
      setCampeonato(actualizado)
      setError('')
      setAviso('Configuración guardada.')
    } catch (causa: unknown) {
      setAviso('')
      setError(causa instanceof Error ? causa.message : 'No se ha podido guardar la configuración.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="configuracion" onSubmit={guardar}>
      <h2>Configuración</h2>
      <p>Datos de la prueba y reglas que se aplican en este campeonato.</p>
      <div className="configuracion__campos">
        <label className="configuracion__ancho">
          Nombre
          <input value={formulario.nombre} onChange={(event) => actualizar('nombre', event.target.value)} />
        </label>
        <label>
          Fecha
          <input value={formulario.fecha} onChange={(event) => actualizar('fecha', event.target.value)} />
        </label>
        <label>
          Lugar
          <input value={formulario.lugar} onChange={(event) => actualizar('lugar', event.target.value)} />
        </label>
        <label>
          Medida mínima (cm)
          <input
            inputMode="decimal"
            value={formulario.medidaMinima}
            onChange={(event) => actualizar('medidaMinima', event.target.value)}
          />
        </label>
        <label>
          Puntos T
          <input
            inputMode="decimal"
            value={formulario.puntosT}
            onChange={(event) => actualizar('puntosT', event.target.value)}
          />
        </label>
        <label className={`configuracion__duos configuracion__ancho${formulario.duos ? ' is-on' : ''}`}>
          <span>
            <strong>Dúos</strong>
            <em>{formulario.duos ? 'La prueba se disputa por parejas.' : 'La prueba es individual.'}</em>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={formulario.duos}
            onChange={(event) => actualizar('duos', event.target.checked)}
          />
          <span className="configuracion__interruptor" aria-hidden="true" />
        </label>
      </div>
      {error && <p className="configuracion__error">{error}</p>}
      {aviso && <p className="configuracion__aviso">{aviso}</p>}
      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </form>
  )
}

function desde(campeonato: Campeonato): Formulario {
  return {
    nombre: campeonato.nombre,
    fecha: campeonato.fecha,
    lugar: campeonato.lugar,
    medidaMinima: numeroTexto(campeonato.medidaMinima),
    puntosT: numeroTexto(campeonato.puntosT),
    duos: campeonato.duos === true,
  }
}

function numeroTexto(valor: number) {
  return typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : ''
}

function numero(valor: string) {
  const texto = valor.trim().replace(',', '.')
  if (texto === '') return null
  const parsed = Number(texto)
  return Number.isFinite(parsed) ? parsed : null
}

function iguales(
  campeonato: Campeonato,
  cambios: { nombre: string; fecha: string; lugar: string; medidaMinima: number; puntosT: number; duos: boolean },
) {
  return (
    campeonato.nombre === cambios.nombre &&
    campeonato.fecha === cambios.fecha &&
    campeonato.lugar === cambios.lugar &&
    campeonato.medidaMinima === cambios.medidaMinima &&
    campeonato.puntosT === cambios.puntosT &&
    campeonato.duos === cambios.duos
  )
}
