import { Activity, CircleDashed, Hourglass, ListChecks, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import TablaSolicitudes from '../components/TablaSolicitudes'
import { Alerta, Cargando, Paginacion, Tarjeta } from '../components/ui'
import { api } from '../services/api'

const TAMANO = 15

function Indicador({ titulo, valor, icono: Icono, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        <Icono className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm text-slate-500">{titulo}</p>
        <p className="text-2xl font-bold text-cosco-950 tabular-nums">{valor ?? '—'}</p>
      </div>
    </div>
  )
}

/** Resumen: indicadores y listado de solicitudes activas (todas menos las completadas). */
export default function ResumenPage() {
  const [conteo, setConteo] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [listado, setListado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.conteoSolicitudes().then(setConteo).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    let vigente = true
    api.solicitudes({ activas: true, pagina, tamano: TAMANO })
      .then((datos) => vigente && setListado(datos))
      .catch((e) => vigente && setError(e.message))
    return () => {
      vigente = false
    }
  }, [pagina])

  const activas = conteo && Object.entries(conteo).reduce((t, [estado, n]) => (estado === 'Completada' ? t : t + n), 0)

  return (
    <div className="space-y-5">
      {error && <Alerta>{error}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Solicitudes activas" valor={activas} icono={Activity} color="bg-cosco-100 text-cosco-800" />
        <Indicador titulo="Por aprobar" valor={conteo?.['Por aprobar']} icono={Hourglass} color="bg-sky-100 text-sky-700" />
        <Indicador titulo="Sin adjudicar" valor={conteo?.['Sin adjudicar']} icono={CircleDashed} color="bg-amber-100 text-amber-700" />
        <Indicador titulo="En proceso" valor={conteo?.['En proceso']} icono={Truck} color="bg-violet-100 text-violet-700" />
      </div>

      <Tarjeta titulo="Solicitudes activas" icono={ListChecks}>
        {!listado && !error && <Cargando />}
        {listado && (
          <>
            <TablaSolicitudes solicitudes={listado.items} />
            <Paginacion pagina={pagina} tamano={TAMANO} total={listado.total} onCambiar={setPagina} />
          </>
        )}
      </Tarjeta>
    </div>
  )
}
