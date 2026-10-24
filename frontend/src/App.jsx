import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BotonSoporte from './components/BotonSoporte'
import Header from './components/Header'
import { Alerta, Cargando } from './components/ui'
import ResumenPage from './pages/ResumenPage'
import SolicitudesPage from './pages/SolicitudesPage'
import TransportadorasPage from './pages/TransportadorasPage'
import { api } from './services/api'
import { tError } from './utils/traducir'

/** Carga una sola vez los catálogos de los desplegables. */
function useCatalogos() {
  const [catalogos, setCatalogos] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    Promise.all([api.rutas(), api.tiposVehiculo(), api.tiposCarga()])
      .then(([rutas, tiposVehiculo, tiposCarga]) => setCatalogos({ rutas, tiposVehiculo, tiposCarga }))
      .catch(setError)
  }, [])
  return { catalogos, error }
}

export default function App() {
  const { t } = useTranslation()
  const [pestana, setPestana] = useState('resumen')
  const [soporteAbierto, setSoporteAbierto] = useState(false)
  const cerrarSoporte = useCallback(() => setSoporteAbierto(false), [])
  const { catalogos, error } = useCatalogos()

  return (
    <div className="min-h-screen">
      <Header activa={pestana} onCambiar={setPestana} onSoporte={() => setSoporteAbierto(true)} />
      <BotonSoporte abierto={soporteAbierto} onAbrir={() => setSoporteAbierto(true)} onCerrar={cerrarSoporte} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {pestana === 'resumen' && <ResumenPage />}
        {pestana === 'solicitudes' &&
          (error ? (
            <Alerta>{tError(t, error)}</Alerta>
          ) : catalogos ? (
            <SolicitudesPage catalogos={catalogos} />
          ) : (
            <Cargando texto={t('comun.cargandoCatalogos')} />
          ))}
        {pestana === 'transportadoras' && <TransportadorasPage />}
      </main>
    </div>
  )
}
