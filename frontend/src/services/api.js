// Llamadas HTTP al backend FastAPI.
// En producción (Netlify) VITE_API_URL debe apuntar al backend publicado, p. ej. https://mi-api.onrender.com
// (sin "/" al final). Vite la incrusta al compilar: si se cambia, hay que volver a desplegar.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API = `${API_URL}/api/v1`

/** Error de la API. `codigo` y `datos` permiten mostrarlo en cualquier idioma (ver utils/traducir.js);
 *  `message` queda como texto de respaldo en español. */
export class ApiError extends Error {
  constructor(status, mensaje, { codigo = 'inesperado', datos = {}, detalle } = {}) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
    this.datos = datos
    this.detalle = detalle
  }
}

/** Convierte el "detail" de FastAPI (texto, objeto o lista de errores) en un ApiError. */
function errorDesdeRespuesta(status, detail) {
  if (detail && typeof detail === 'object' && !Array.isArray(detail) && detail.codigo) {
    return new ApiError(status, detail.mensaje, { codigo: detail.codigo, datos: detail.datos, detalle: detail })
  }
  if (Array.isArray(detail)) {
    const texto = detail.map((e) => `${e.loc?.slice(1).join('.') || 'dato'}: ${e.msg}`).join(' · ')
    return new ApiError(status, texto, { codigo: 'datos_invalidos', detalle: detail })
  }
  const texto = typeof detail === 'string' ? detail : detail?.mensaje || 'Error inesperado del servidor'
  return new ApiError(status, texto, { codigo: status >= 500 ? 'interno' : 'inesperado', detalle: detail })
}

async function pedir(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    })
  } catch {
    throw new ApiError(0, `No se pudo conectar con el backend (${API_URL}).`, { codigo: 'sin_conexion', datos: { url: API_URL } })
  }
  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw errorDesdeRespuesta(respuesta.status, cuerpo?.detail)
  return cuerpo
}

const post = (ruta, datos) => pedir(ruta, { method: 'POST', body: JSON.stringify(datos) })

export const api = {
  rutas: () => pedir('/rutas'),
  tiposCarga: () => pedir('/tipos-carga'),
  tiposVehiculo: () => pedir('/tipos-vehiculo'),
  proveedores: () => pedir('/proveedores'),
  /** Calcula los pesos (%) y el ranking SIN guardar. */
  simularSolicitud: (datos) => post('/solicitudes/simular', datos),
  /** Guarda la solicitud con el proveedor elegido (estado "Por aprobar"). */
  confirmarSolicitud: (datos, proveedorId) => post('/solicitudes', { ...datos, proveedor_id: proveedorId }),
  solicitudes: ({ activas = false, estado, pagina = 1, tamano = 20 } = {}) => {
    const params = new URLSearchParams({ activas, pagina, tamano })
    if (estado) params.set('estado', estado)
    return pedir(`/solicitudes?${params}`)
  },
  conteoSolicitudes: () => pedir('/solicitudes/conteo'),
}
