import { Award, CheckCircle2, Circle, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { COLOR_FACTOR } from '../theme/colores'
import { formatoCOP, formatoHoras, formatoNumero } from '../utils/formato'
import { tIndicador } from '../utils/traducir'
import { Insignia } from './ui'

function BarraCalificacion({ valor, color }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, valor)}%`, backgroundColor: color }} />
    </div>
  )
}

/** Tabla seleccionable con las transportadoras sugeridas. */
export default function TablaTop3({ proveedores, seleccionado, onSeleccionar }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {proveedores.map((p) => {
        const elegido = p.proveedor_id === seleccionado
        return (
          <button
            key={p.proveedor_id}
            type="button"
            onClick={() => onSeleccionar(p.proveedor_id)}
            aria-pressed={elegido}
            className={`w-full rounded-xl p-4 text-left ring-1 transition ${
              elegido ? 'bg-cosco-50 ring-2 ring-cosco-600' : 'bg-white ring-slate-200 hover:ring-cosco-200'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {elegido ? (
                  <CircleCheck className="h-5 w-5 text-cosco-700" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" aria-hidden />
                )}
                <div>
                  <p className="font-semibold text-slate-900">
                    {p.posicion}. {p.nombre}
                  </p>
                  <p className="text-xs text-slate-500">{t('top3.vehiculosDisponibles', { count: p.vehiculos_disponibles })}</p>
                </div>
              </div>
              {p.posicion === 1 ? (
                <Insignia tono="bg-acento text-white ring-acento">
                  <Award className="h-3.5 w-3.5" aria-hidden /> {t('top3.mejorAjuste')}
                </Insignia>
              ) : (
                <Insignia tono="bg-cosco-50 text-cosco-700 ring-cosco-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t('top3.elegible')}
                </Insignia>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">{t('top3.costo')}</dt>
                <dd className="font-semibold tabular-nums">{formatoCOP(p.precio_cop)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('top3.tiempoTransito')}</dt>
                <dd className="font-semibold tabular-nums">{formatoHoras(p.tiempo_estimado_h)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('top3.cumplimiento')}</dt>
                <dd className="font-semibold tabular-nums">{formatoNumero(p.puntaje_cumplimiento)} %</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('top3.score')}</dt>
                <dd className="text-lg font-bold text-cosco-800 tabular-nums">{formatoNumero(p.score_final)}</dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
              {[
                ['precio', p.calificacion_precio],
                ['confiabilidad', p.calificacion_confiabilidad],
                ['tiempo', p.calificacion_tiempo],
              ].map(([factor, valor]) => (
                <div key={factor}>
                  <div className="mb-1 flex justify-between">
                    <span>{t(`factores.${factor}`)}</span>
                    <span className="tabular-nums">{formatoNumero(valor)}</span>
                  </div>
                  <BarraCalificacion valor={valor} color={COLOR_FACTOR[factor]} />
                </div>
              ))}
            </div>

            {(p.fortaleza || p.debilidad) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {p.fortaleza && <span className="text-emerald-700">▲ {tIndicador(t, p.fortaleza)}</span>}
                {p.debilidad && <span className="text-red-700">▼ {tIndicador(t, p.debilidad)}</span>}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
