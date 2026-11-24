import { useEffect, useState } from 'react'
import { suscribirCarga } from '../api'
import './Carga.css'

export function Carga() {
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => suscribirCarga(setPendientes), [])

  if (pendientes === 0) return null

  return (
    <div className="carga" role="status" aria-live="polite" aria-busy="true">
      <div className="carga__panel">
        <span className="carga__anillo" aria-hidden="true" />
        <p>Cargando</p>
      </div>
    </div>
  )
}
