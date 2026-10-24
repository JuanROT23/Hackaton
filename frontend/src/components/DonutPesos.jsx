import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { COLOR_FACTOR } from '../theme/colores'
import { formatoPct } from '../utils/formato'

// Factores de decisión; el nombre visible sale del diccionario (factores.<clave>)
export const CRITERIOS = [
  { clave: 'precio', color: COLOR_FACTOR.precio },
  { clave: 'confiabilidad', color: COLOR_FACTOR.confiabilidad },
  { clave: 'tiempo', color: COLOR_FACTOR.tiempo },
]

/** Donut con los pesos (%) de cada factor y su leyenda. */
export default function DonutPesos({ pesos }) {
  const { t } = useTranslation()
  const datos = CRITERIOS.map((c) => ({ ...c, nombre: t(`factores.${c.clave}`), valor: pesos[c.clave] }))
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
              {datos.map((d) => (
                <Cell key={d.clave} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatoPct(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-extrabold text-cosco-900">100 %</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {datos.map((d) => (
          <li key={d.clave} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} aria-hidden />
              {d.nombre}
            </span>
            <span className="font-semibold tabular-nums">{formatoPct(d.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
