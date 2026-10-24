import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatoCOP, formatoFecha, formatoHoras, formatoNumero } from '../utils/formato'
import { tCatalogo } from '../utils/traducir'
import { InsigniaEstado } from './ui'

const COLUMNAS = [
  ['id'], ['fecha'], ['cliente'], ['ruta'], ['carga'], ['peso', true],
  ['transportadora'], ['costo', true], ['tiempo', true], ['estado'],
]

/** Tabla de solicitudes (para Resumen y Solicitudes). Ciudades y proveedores no se traducen. */
export default function TablaSolicitudes({ solicitudes }) {
  const { t } = useTranslation()
  if (!solicitudes.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{t('tabla.vacia')}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {COLUMNAS.map(([clave, derecha], i) => (
              <th key={clave} className={`py-2 font-medium ${i < COLUMNAS.length - 1 ? 'pr-4' : ''} ${derecha ? 'text-right' : ''}`}>
                {t(`tabla.${clave}`)}
              </th>
            ))}
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
                  {s.origen} <ArrowRight className="h-3 w-3 text-slate-400" aria-label={t('comun.hacia')} /> {s.destino}
                </span>
              </td>
              <td className="py-2.5 pr-4">{tCatalogo(t, s.tipo_carga)}</td>
              <td className="py-2.5 pr-4 text-right whitespace-nowrap">{formatoNumero(s.peso_kg)} kg</td>
              <td className="py-2.5 pr-4">{s.proveedor ?? <span className="text-slate-400">{t('comun.sinAsignar')}</span>}</td>
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
