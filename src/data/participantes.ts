export type Participante = {
  id: string
  nombre: string
  fechaNacimiento: string
  dni: string
}

const clave = (campeonatoId: string) => `thelake-participantes:${campeonatoId}`

const letrasDni = 'TRWAGMYFPDXBNJZSQVHLCKE'
const alfabetoId = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizarDni(valor: string) {
  return valor.toUpperCase().replace(/[\s-]/g, '')
}

export function dniValido(valor: string) {
  const documento = normalizarDni(valor)
  const dni = /^(\d{8})([A-Z])$/.exec(documento)
  if (dni) return letrasDni[Number(dni[1]) % 23] === dni[2]

  const nie = /^([XYZ])(\d{7})([A-Z])$/.exec(documento)
  if (!nie) return false
  const prefijo = nie[1] === 'X' ? '0' : nie[1] === 'Y' ? '1' : '2'
  return letrasDni[Number(prefijo + nie[2]) % 23] === nie[3]
}

export function crearIdAcceso(ocupados: string[]) {
  const usados = new Set(ocupados)
  let id = ''
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(8))
    id = Array.from(bytes, (byte) => alfabetoId[byte % alfabetoId.length]).join('')
  } while (usados.has(id))
  return id
}

export function loadParticipantes(campeonatoId: string): Participante[] {
  const raw = localStorage.getItem(clave(campeonatoId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Participante[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveParticipantes(campeonatoId: string, participantes: Participante[]) {
  localStorage.setItem(clave(campeonatoId), JSON.stringify(participantes))
}
