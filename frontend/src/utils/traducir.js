// Traducción de valores que llegan del backend (catálogos, estados, indicadores, motivos y errores).
// Si un valor no está en el diccionario se muestra tal como llegó.
import i18n from '../i18n'
import { formatoLista, formatoNumero } from './formato'

/** Nombre de un tipo de carga o de vehículo ("Carga General" -> "General cargo"). */
export const tCatalogo = (t, nombre) => (nombre ? t(`catalogo.${nombre}`, { defaultValue: nombre }) : '')

/** Estado de una solicitud ("Por aprobar" -> "Pending approval"). */
export const tEstado = (t, estado) => t(`estados.${estado}`, { defaultValue: estado })

/** Fortaleza/debilidad del Excel: "Indicador relativo destacado: Precio". */
export function tIndicador(t, texto) {
  const partes = texto?.match(/^Indicador relativo (destacado|a revisar): (.+)$/)
  if (!partes) return texto
  const clave = partes[1] === 'destacado' ? 'destacado' : 'revisar'
  return t(`indicadores.${clave}`, { indicador: t(`indicadores.nombres.${partes[2]}`, { defaultValue: partes[2] }) })
}

/** Prepara los datos de un motivo: traduce catálogos y formatea números y listas. */
function datosParaTexto(t, datos = {}) {
  const r = { ...datos }
  for (const campo of ['tipo', 'carga']) if (r[campo]) r[campo] = tCatalogo(t, r[campo])
  for (const campo of ['peso', 'maximo', 'volumen']) if (typeof r[campo] === 'number') r[campo] = formatoNumero(r[campo])
  if (Array.isArray(r.ofrece)) r.ofrece = formatoLista(r.ofrece.map((n) => tCatalogo(t, n)))
  if (Array.isArray(r.puertos)) r.puertos = formatoLista(r.puertos, 'disjunction')
  if (r.entidad) r.entidad = t(`errores.entidades.${r.entidad}`, { defaultValue: r.entidad })
  return r
}

/** Un motivo { codigo, datos } como frase en el idioma activo. */
export const tMotivo = (t, motivo) => t(`motivos.${motivo.codigo}`, { ...datosParaTexto(t, motivo.datos), defaultValue: '' })

/** Mensaje de un ApiError (o de un texto) en el idioma activo. */
export function tError(t, error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  const { codigo, detalle } = error
  const problemas = (detalle?.problemas ?? []).map((m) => tMotivo(t, m))
  if (codigo === 'capacidad') return t('errores.capacidad', { problemas: problemas.join('; ') })
  if (codigo === 'proveedor_no_valido') {
    return t('errores.proveedor_no_valido', { motivo: problemas.join(' · ') || t('errores.noCompatible') })
  }
  if (codigo && i18n.exists(`errores.${codigo}`)) return t(`errores.${codigo}`, datosParaTexto(t, error.datos))
  return error.message
}
