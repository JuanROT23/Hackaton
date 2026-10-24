import { BarChart3, Building2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Alerta, Cargando, Insignia, Tarjeta } from '../components/ui'
import { api } from '../services/api'
import { COLORES } from '../theme/colores'
import { formatoNumero } from '../utils/formato'

const SERIES = [
  { clave: 'puntaje_precio', nombre: 'Precio', color: COLORES.primario },
  { clave: 'puntaje_tiempo', nombre: 'Tiempo', color: COLORES.acento },
  { clave: 'puntaje_cumplimiento', nombre: 'Cumplimiento', color: COLORES.secundario },
  { clave: 'puntaje_seguridad', nombre: 'Seguridad', color: COLORES.azulSuave },
]

/** Vista analítica de transportadoras: puntajes base y solicitudes en curso. */
export default function TransportadorasPage() {
  const [proveedores, setProveedores] = useState(null)
  const [activas, setActivas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.proveedores().then(setProveedores).catch((e) => setError(e.message))
    api.solicitudes({ activas: true, tamano: 100 })
      .then((d) => setActivas(d.items))
      .catch((e) => setError(e.message))
  }, [])

  // Solicitudes en curso (no completadas ni canceladas) por transportadora
  const enCurso = useMemo(() => {
    const cuenta = {}
    for (const s of activas) if (s.proveedor && s.estado !== 'Cancelada') cuenta[s.proveedor] = (cuenta[s.proveedor] ?? 0) + 1
    return cuenta
  }, [activas])

  if (error) return <Alerta>{error}</Alerta>
  if (!proveedores) return <Cargando />

  const datos = proveedores.map((p) => ({ nombre: p.nombre, ...p.puntaje }))
  const ordenados = [...proveedores].sort((a, b) => (b.puntaje?.puntaje_cumplimiento ?? 0) - (a.puntaje?.puntaje_cumplimiento ?? 0))

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Puntajes base por transportadora (0-100)" icono={BarChart3}>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORES.rejilla} />
              <XAxis dataKey="nombre" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatoNumero(v)} />
              <Legend verticalAlign="top" height={32} />
              {SERIES.map((s) => (
                <Bar key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">El eje inicia en 60 para resaltar diferencias. Datos sintéticos del reto; no son evaluaciones reales de las empresas.</p>
      </Tarjeta>

      <Tarjeta titulo="Detalle y seguimiento" icono={Building2}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">Transportadora</th>
                <th className="py-2 pr-4 text-right font-medium">Experiencia</th>
                <th className="py-2 pr-4 text-right font-medium">Servicios</th>
                <th className="py-2 pr-4 text-right font-medium">Cumplimiento</th>
                <th className="py-2 pr-4 text-right font-medium">Seguridad</th>
                <th className="py-2 pr-4 text-right font-medium">En curso</th>
                <th className="py-2 font-medium">Fortaleza / debilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordenados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium">
                    {p.nombre} {!p.activo && <Insignia>Inactivo</Insignia>}
                  </td>
                  <td className="py-2.5 pr-4 text-right">{p.experiencia_anios ? `${p.experiencia_anios} años` : '—'}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{p.puntaje?.n_servicios ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatoNumero(p.puntaje?.puntaje_cumplimiento)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatoNumero(p.puntaje?.puntaje_seguridad)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{enCurso[p.nombre] ?? 0}</td>
                  <td className="py-2.5 text-xs">
                    <span className="block text-emerald-700">{p.puntaje?.fortaleza}</span>
                    <span className="block text-red-700">{p.puntaje?.debilidad}</span>
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
