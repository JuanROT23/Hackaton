import i18n from '../i18n'

// Formato regional según el idioma activo: 4.500 / 24 oct 2026 (es) o 4,500 / Oct 24, 2026 (en)
export const localeActual = () => (i18n.resolvedLanguage === 'en' ? 'en-US' : 'es-CO')

const cop = () => new Intl.NumberFormat(localeActual(), { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const numero = () => new Intl.NumberFormat(localeActual(), { maximumFractionDigits: 2 })

export const formatoCOP = (valor) => (valor == null ? '—' : cop().format(valor))
export const formatoNumero = (valor) => (valor == null ? '—' : numero().format(valor))
export const formatoPct = (fraccion) => `${numero().format(Math.round(fraccion * 1000) / 10)} %`
export const formatoHoras = (horas) => (horas == null ? '—' : `${horas} h`)
export const formatoFecha = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(localeActual(), { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** Une una lista con la gramática del idioma: "A, B y C" / "A, B and C" ("o" / "or" si es disyuntiva). */
export const formatoLista = (elementos, tipo = 'conjunction') =>
  new Intl.ListFormat(localeActual(), { style: 'long', type: tipo }).format(elementos)

/** Id temporal para una solicitud que aún no se guarda, p. ej. BOR-20261024-4821. */
export function idBorrador() {
  const hoy = new Date()
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
  return `BOR-${fecha}-${Math.floor(1000 + Math.random() * 9000)}`
}
