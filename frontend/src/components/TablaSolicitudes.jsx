import { ArrowRight } from 'lucide-react'
import { formatoCOP, formatoFecha, formatoHoras, formatoNumero } from '../utils/formato'
import { InsigniaEstado } from './ui'

/** Tabla de solicitudes (para Resumen y Solicitudes). */
export default function TablaSolicitudes({ solicitudes }) {
  if (!solicitudes.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No hay solicitudes para mostrar.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-medium">ID</th>
            <th className="py-2 pr-4 font-medium">Fecha</th>
            <th className="py-2 pr-4 font-medium">Cliente</th>
            <th className="py-2 pr-4 font-medium">Ruta</th>
            <th className="py-2 pr-4 font-medium">Carga</th>
            <th className="py-2 pr-4 text-right font-medium">Peso</th>
            <th className="py-2 pr-4 font-medium">Transportadora</th>
            <th className="py-2 pr-4 text-right font-medium">Costo</th>
            <th className="py-2 pr-4 text-right font-medium">Tiempo</th>
            <th className="py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{s.id}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap">{formatoFecha(s.fecha_solicitud)}</td>
              <td className="py-2.5 pr-4">{s.cliente_nombre}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  {s.origen} <ArrowRight className="h-3 w-3 text-slate-400" aria-label="hacia" /> {s.destino}
                </span>
              </td>
              <td className="py-2.5 pr-4">{s.tipo_carga}</td>
              <td className="py-2.5 pr-4 text-right whitespace-nowrap">{formatoNumero(s.peso_kg)} kg</td>
              <td className="py-2.5 pr-4">{s.proveedor ?? <span className="text-slate-400">Sin asignar</span>}</td>
              <td className="py-2.5 pr-4 text-right whitespace-nowrap">{formatoCOP(s.precio_cotizado_cop)}</td>
              <td className="py-2.5 pr-4 text-right">{formatoHoras(s.tiempo_estimado_h)}</td>
              <td className="py-2.5">
                <InsigniaEstado estado={s.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
