// Llamadas HTTP al backend FastAPI.
// En producción (Netlify) VITE_API_URL debe apuntar al backend publicado, p. ej. https://mi-api.onrender.com
// (sin "/" al final). Vite la incrusta al compilar: si se cambia, hay que volver a desplegar.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API = `${API_URL}/api/v1`

/** Error del backend con su código HTTP y un mensaje legible. */
export class ApiError extends Error {
  constructor(status, mensaje, detalle) {
    super(mensaje)
    this.status = status
    this.detalle = detalle
  }
}

/** Convierte el "detail" de FastAPI (texto, objeto o lista de errores) en un mensaje. */
function mensajeDeError(detail) {
  if (!detail) return 'Error inesperado del servidor'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((e) => `${e.loc?.slice(1).join('.') || 'dato'}: ${e.msg}`).join(' · ')
  }
  return detail.mensaje || 'Error inesperado del servidor'
}

async function pedir(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    })
  } catch {
    throw new ApiError(0, `No se pudo conectar con el backend (${API_URL}). Verifique que esté en línea.`)
  }
  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, mensajeDeError(cuerpo?.detail), cuerpo?.detail)
  }
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
