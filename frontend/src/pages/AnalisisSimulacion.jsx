import { ArrowLeft, ArrowRight, Clock, Map as IconoMapa, Package, PieChart, ShieldCheck, Truck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DonutPesos from '../components/DonutPesos'
import MapaRuta from '../components/MapaRuta'
import TablaTop3 from '../components/TablaTop3'
import { Alerta, Boton, Tarjeta } from '../components/ui'
import { formatoHoras } from '../utils/formato'
import { tCatalogo, tError, tMotivo } from '../utils/traducir'

/** Vista de análisis: mapa, pesos de las prioridades y Top 3 para elegir transportadora. */
export default function AnalisisSimulacion({ borrador, simulacion, ruta, carga, vehiculo, confirmando, errorApi, onVolver, onConfirmar }) {
  const { t } = useTranslation()
  const [seleccionado, setSeleccionado] = useState(null)
  const [verDescartados, setVerDescartados] = useState(false)
  const top3 = simulacion.ranking.slice(0, 3)
  const elegido = simulacion.ranking.find((p) => p.proveedor_id === seleccionado)
  const tiempo = (elegido ?? simulacion.recomendado).tiempo_estimado_h
  const descartados = simulacion.descartados

  return (
    <div className="space-y-5">
      {/* Cabecera del borrador */}
      <div className="flex flex-col gap-4 rounded-xl bg-cosco-900 p-5 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs text-cosco-100/80">{t('analisis.borrador', { id: borrador })}</p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold">
            {ruta.origen_municipio} <ArrowRight className="h-5 w-5 text-cosco-100" aria-label={t('comun.hacia')} /> {ruta.destino_municipio}
          </h2>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2"><Package className="h-4 w-4 text-cosco-100" aria-hidden />{tCatalogo(t, carga.nombre)}</span>
          <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-cosco-100" aria-hidden />{tCatalogo(t, vehiculo.nombre)}</span>
          <span className="flex items-center gap-2"><IconoMapa className="h-4 w-4 text-cosco-100" aria-hidden />{ruta.distancia_km} km</span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cosco-100" aria-hidden />
            {t('analisis.tiempoEstimado', { tiempo: formatoHoras(tiempo) })}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <Tarjeta titulo={t('analisis.ruta')} icono={IconoMapa}>
            <MapaRuta origen={ruta.origen_municipio} destino={ruta.destino_municipio} />
          </Tarjeta>
          <Tarjeta titulo={t('analisis.prioridades')} icono={PieChart}>
            <DonutPesos pesos={simulacion.pesos} />
          </Tarjeta>
        </div>

        <Tarjeta titulo={t('analisis.top3')} icono={ShieldCheck} className="lg:col-span-3">
          <p className="mb-4 text-sm text-slate-500">{t('analisis.compatibles', { count: simulacion.ranking.length })}</p>
          <TablaTop3 proveedores={top3} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />

          {descartados.length > 0 && (
            <div className="mt-4 text-sm">
              <button type="button" className="font-medium text-cosco-700 hover:underline" onClick={() => setVerDescartados((v) => !v)}>
                {verDescartados ? t('analisis.ocultarDescartados') : t('analisis.verDescartados', { count: descartados.length })}
              </button>
              {verDescartados && (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3 ring-1 ring-slate-200">
                  {descartados.map((d) => (
                    <li key={d.proveedor_id} className="py-2">
                      <p className="font-medium text-slate-800">{d.nombre}</p>
                      {/* motivos = { codigo, datos } traducibles; si faltan, el texto en español del backend */}
                      <ul className="mt-0.5 list-inside list-disc text-xs text-slate-600">
                        {(d.motivos?.length ? d.motivos.map((m) => tMotivo(t, m)) : d.motivo.split(' · ')).map((texto) => (
                          <li key={texto}>{texto}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {errorApi && <div className="mt-4"><Alerta>{tError(t, errorApi)}</Alerta></div>}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Boton variante="secundario" onClick={onVolver}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t('analisis.editar')}
            </Boton>
            <Boton variante="exito" disabled={!elegido || confirmando} onClick={() => onConfirmar(elegido)}>
              {t('analisis.confirmar')}
            </Boton>
          </div>
          {!elegido && <p className="mt-2 text-right text-xs text-slate-500">{t('analisis.seleccioneParaHabilitar')}</p>}
        </Tarjeta>
      </div>
    </div>
  )
}
