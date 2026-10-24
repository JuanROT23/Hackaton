import { Activity, CircleDashed, Hourglass, ListChecks, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TablaSolicitudes from '../components/TablaSolicitudes'
import { Alerta, Cargando, Paginacion, Tarjeta } from '../components/ui'
import { api } from '../services/api'
import { tError } from '../utils/traducir'

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
  const { t } = useTranslation()
  const [conteo, setConteo] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [listado, setListado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.conteoSolicitudes().then(setConteo).catch(setError)
  }, [])

  useEffect(() => {
    let vigente = true
    api.solicitudes({ activas: true, pagina, tamano: TAMANO })
      .then((datos) => vigente && setListado(datos))
      .catch((e) => vigente && setError(e))
    return () => {
      vigente = false
    }
  }, [pagina])

  const activas = conteo && Object.entries(conteo).reduce((total, [estado, n]) => (estado === 'Completada' ? total : total + n), 0)

  return (
    <div className="space-y-5">
      {error && <Alerta>{tError(t, error)}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo={t('resumen.activas')} valor={activas} icono={Activity} color="bg-cosco-100 text-cosco-800" />
        <Indicador titulo={t('resumen.porAprobar')} valor={conteo?.['Por aprobar']} icono={Hourglass} color="bg-sky-100 text-sky-700" />
        <Indicador titulo={t('resumen.sinAdjudicar')} valor={conteo?.['Sin adjudicar']} icono={CircleDashed} color="bg-amber-100 text-amber-700" />
        <Indicador titulo={t('resumen.enProceso')} valor={conteo?.['En proceso']} icono={Truck} color="bg-violet-100 text-violet-700" />
      </div>

      <Tarjeta titulo={t('resumen.tituloTabla')} icono={ListChecks}>
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
