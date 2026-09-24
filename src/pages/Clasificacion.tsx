import { Link, useParams } from 'react-router-dom'
import { clasificacionFinal, clasificarManga } from '../data/clasificacion'
import { loadMangas } from '../data/mangas'
import { loadParticipantes } from '../data/participantes'
import './Clasificacion.css'

export function Clasificacion() {
  const { campeonatoId = '' } = useParams()
  const participantes = loadParticipantes(campeonatoId)
  const mangas = loadMangas(campeonatoId)
  const final = clasificacionFinal(mangas, participantes)
  const nombres = new Map(participantes.map((participante) => [participante.id, participante.nombre]))

  if (mangas.length === 0) {
    return <p className="clasificacion__vacio">Todavía no hay mangas para clasificar.</p>
  }

  return (
    <div className="clasificacion">
      {mangas.map((manga) => {
        const filas = clasificarManga(manga, participantes)
        return (
          <section key={manga.id} className="clasificacion__bloque">
            <h2>{manga.nombre}</h2>
            <div className="clasificacion__tabla">
              <table>
                <thead>
                  <tr>
                    <th>Puesto</th>
                    <th>Participante</th>
                    <th>Puntos</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filas.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No hay participantes en esta clasificación.</td>
                    </tr>
                  ) : (
                    filas.map((fila) => (
                      <tr key={fila.participanteId}>
                        <td>{textoPuesto(fila.puesto)}</td>
                        <td>{nombres.get(fila.participanteId) ?? 'Participante'}</td>
                        <td>{textoPuntos(fila.puntos)}</td>
                        <td>
                          <Link to={`${manga.id}/${fila.participanteId}`}>Ver detalle</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      <section className="clasificacion__bloque">
        <h2>Clasificación final</h2>
        <p>El puesto final sale de los puestos de cada manga. Los puntos totales suman los puntos de todas las mangas.</p>
        <Tabla
          columnas={['Puesto', 'Participante', ...mangas.map((manga) => manga.nombre), 'Suma de puestos', 'Puntos totales']}
          filas={final.map((fila) => [
            textoPuesto(fila.puesto),
            nombres.get(fila.participanteId) ?? 'Participante',
            ...fila.puestos.map(textoPuesto),
            fila.suma === null ? 'Pendiente' : String(fila.suma),
            textoPuntos(fila.puntosTotales),
          ])}
        />
      </section>
    </div>
  )
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: string[][] }) {
  return (
    <div className="clasificacion__tabla">
      <table>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna}>{columna}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length}>No hay participantes en esta clasificación.</td>
            </tr>
          ) : (
            filas.map((fila) => (
              <tr key={fila.join('-')}>
                {fila.map((celda, indice) => (
                  <td key={`${fila[1]}-${indice}`}>{celda}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function textoPuesto(puesto: number | null) {
  return puesto === null ? 'Pendiente' : String(puesto)
}

function textoPuntos(puntos: number | null) {
  return puntos === null ? 'Pendiente' : String(puntos)
}
