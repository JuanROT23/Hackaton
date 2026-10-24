const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

export const formatoCOP = (valor) => (valor == null ? '—' : cop.format(valor))
export const formatoNumero = (valor) => (valor == null ? '—' : numero.format(valor))
export const formatoPct = (fraccion) => `${numero.format(Math.round(fraccion * 1000) / 10)} %`
export const formatoHoras = (horas) => (horas == null ? '—' : `${horas} h`)
export const formatoFecha = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** Id temporal para una solicitud que aún no se guarda, p. ej. BOR-20261024-4821. */
export function idBorrador() {
  const hoy = new Date()
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
  return `BOR-${fecha}-${Math.floor(1000 + Math.random() * 9000)}`
}
