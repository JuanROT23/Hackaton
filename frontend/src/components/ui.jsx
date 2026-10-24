// Piezas de interfaz pequeñas y reutilizables.
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import { useEffect } from 'react'

export function Tarjeta({ titulo, icono: Icono, acciones, children, className = '' }) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      {(titulo || acciones) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && (
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {Icono && <Icono className="h-4 w-4 text-cosco-700" aria-hidden />}
              {titulo}
            </h2>
          )}
          {acciones}
        </div>
      )}
      {children}
    </section>
  )
}

const COLORES_ESTADO = {
  'Sin adjudicar': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Por aprobar': 'bg-cosco-100 text-cosco-800 ring-cosco-200',
  'En proceso': 'bg-violet-100 text-violet-800 ring-violet-200',
  Completada: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Cancelada: 'bg-slate-200 text-slate-600 ring-slate-300',
}

export function Insignia({ children, tono = 'bg-slate-100 text-slate-700 ring-slate-200' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tono}`}>
      {children}
    </span>
  )
}

export const InsigniaEstado = ({ estado }) => <Insignia tono={COLORES_ESTADO[estado]}>{estado}</Insignia>

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-cosco-700" aria-hidden />
      {texto}
    </div>
  )
}

const ESTILOS_ALERTA = {
  error: { icono: AlertCircle, clases: 'bg-red-50 text-acento-oscuro ring-acento/30' },
  aviso: { icono: AlertTriangle, clases: 'bg-amber-50 text-amber-900 ring-amber-200' },
  exito: { icono: CheckCircle2, clases: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
}

export function Alerta({ tipo = 'error', children, onCerrar }) {
  const { icono: Icono, clases } = ESTILOS_ALERTA[tipo]
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg p-4 text-sm ring-1 ${clases}`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="rounded p-0.5 hover:bg-black/5" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function Boton({ variante = 'primario', className = '', children, ...props }) {
  const estilos = {
    primario: 'bg-cosco-900 text-white hover:bg-cosco-800 disabled:bg-slate-300',
    secundario: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
    exito: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300',
  }
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Ventana modal; se cierra con Escape o con el botón X. */
export function Modal({ titulo, abierto, onCerrar, children }) {
  useEffect(() => {
    if (!abierto) return undefined
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [abierto, onCerrar])

  if (!abierto) return null
  return (
    // z-[1200]: por encima del encabezado fijo (1100) y del botón de soporte (1150)
    <div className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-cosco-950/60 p-4 sm:p-8">
      <div role="dialog" aria-modal="true" aria-label={titulo} className="w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl bg-white px-6 py-4 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-cosco-950">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function Paginacion({ pagina, tamano, total, onCambiar }) {
  const paginas = Math.max(1, Math.ceil(total / tamano))
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        {total} registro{total === 1 ? '' : 's'} · página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        <Boton variante="secundario" className="px-3 py-1.5" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
          Anterior
        </Boton>
        <Boton variante="secundario" className="px-3 py-1.5" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>
          Siguiente
        </Boton>
      </div>
    </div>
  )
}
