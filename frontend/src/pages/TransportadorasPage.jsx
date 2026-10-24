import { BarChart3, Building2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Alerta, Cargando, Insignia, Tarjeta } from '../components/ui'
import { api } from '../services/api'
import { COLORES } from '../theme/colores'
import { formatoNumero } from '../utils/formato'
import { tError, tIndicador } from '../utils/traducir'

// El nombre de cada serie sale del diccionario: transportadoras.series.<nombre>
const SERIES = [
  { clave: 'puntaje_precio', nombre: 'precio', color: COLORES.primario },
  { clave: 'puntaje_tiempo', nombre: 'tiempo', color: COLORES.acento },
  { clave: 'puntaje_cumplimiento', nombre: 'cumplimiento', color: COLORES.secundario },
  { clave: 'puntaje_seguridad', nombre: 'seguridad', color: COLORES.azulSuave },
]

const COLUMNAS = [
  ['transportadora'], ['experiencia', true], ['servicios', true], ['cumplimiento', true],
  ['seguridad', true], ['enCurso', true], ['fortalezaDebilidad'],
]

/** Vista analítica de transportadoras: puntajes base y solicitudes en curso. */
export default function TransportadorasPage() {
  const { t } = useTranslation()
  const [proveedores, setProveedores] = useState(null)
  const [activas, setActivas] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api.proveedores().then(setProveedores).catch(setError)
    api.solicitudes({ activas: true, tamano: 100 })
      .then((d) => setActivas(d.items))
      .catch(setError)
  }, [])

  // Solicitudes en curso (no completadas ni canceladas) por transportadora
  const enCurso = useMemo(() => {
    const cuenta = {}
    for (const s of activas) if (s.proveedor && s.estado !== 'Cancelada') cuenta[s.proveedor] = (cuenta[s.proveedor] ?? 0) + 1
    return cuenta
  }, [activas])

  if (error) return <Alerta>{tError(t, error)}</Alerta>
  if (!proveedores) return <Cargando />

  const datos = proveedores.map((p) => ({ nombre: p.nombre, ...p.puntaje }))
  const ordenados = [...proveedores].sort((a, b) => (b.puntaje?.puntaje_cumplimiento ?? 0) - (a.puntaje?.puntaje_cumplimiento ?? 0))

  return (
    <div className="space-y-5">
      <Tarjeta titulo={t('transportadoras.tituloGrafico')} icono={BarChart3}>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORES.rejilla} />
              <XAxis dataKey="nombre" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatoNumero(v)} />
              <Legend verticalAlign="top" height={32} />
              {SERIES.map((s) => (
                <Bar key={s.clave} dataKey={s.clave} name={t(`transportadoras.series.${s.nombre}`)} fill={s.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t('transportadoras.nota')}</p>
      </Tarjeta>

      <Tarjeta titulo={t('transportadoras.detalle')} icono={Building2}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                {COLUMNAS.map(([clave, derecha], i) => (
                  <th key={clave} className={`py-2 font-medium ${i < COLUMNAS.length - 1 ? 'pr-4' : ''} ${derecha ? 'text-right' : ''}`}>
                    {t(`transportadoras.columnas.${clave}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordenados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium">
                    {p.nombre} {!p.activo && <Insignia>{t('comun.inactivo')}</Insignia>}
                  </td>
                  <td className="py-2.5 pr-4 text-right">{p.experiencia_anios ? t('comun.anios', { count: p.experiencia_anios }) : '—'}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{p.puntaje?.n_servicios ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatoNumero(p.puntaje?.puntaje_cumplimiento)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatoNumero(p.puntaje?.puntaje_seguridad)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{enCurso[p.nombre] ?? 0}</td>
                  <td className="py-2.5 text-xs">
                    <span className="block text-emerald-700">{tIndicador(t, p.puntaje?.fortaleza)}</span>
                    <span className="block text-red-700">{tIndicador(t, p.puntaje?.debilidad)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  )
}
