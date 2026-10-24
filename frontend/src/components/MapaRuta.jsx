import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { CENTRO_COLOMBIA, COORDENADAS } from '../data/municipios'
import { COLORES } from '../theme/colores'

// Teselas públicas de OpenStreetMap: no requieren API key. Se usa el dominio sin
// subdominios ({s}.tile...), que es el que hoy recomienda OpenStreetMap.
const TESELAS_OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// Servicio público de rutas por carretera (OSRM sobre OpenStreetMap)
const OSRM = 'https://router.project-osrm.org/route/v1/driving'
// Recuadro de Colombia continental: el mapa no se aleja de aquí
const LIMITES_COLOMBIA = [[-4.5, -82], [13.5, -66]]

/** Trazado por carretera entre dos puntos; si el servicio falla, la línea recta. */
function useTrazado(desde, hasta) {
  const [trazado, setTrazado] = useState({ puntos: [], real: false, cargando: false })
  const clave = desde && hasta ? `${desde}|${hasta}` : ''

  useEffect(() => {
    if (!clave) return undefined
    const recta = { puntos: [desde, hasta], real: false, cargando: false }
    const control = new AbortController()
    setTrazado({ ...recta, cargando: true })
    // OSRM recibe "longitud,latitud" y devuelve GeoJSON [longitud, latitud]
    // overview=simplified: suficiente detalle a escala de país, con muchos menos puntos
    fetch(`${OSRM}/${desde[1]},${desde[0]};${hasta[1]},${hasta[0]}?overview=simplified&geometries=geojson`, { signal: control.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((datos) => {
        const coordenadas = datos.routes?.[0]?.geometry?.coordinates
        if (!coordenadas?.length) throw new Error('sin ruta')
        setTrazado({ puntos: coordenadas.map(([lon, lat]) => [lat, lon]), real: true, cargando: false })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setTrazado(recta)
      })
    return () => control.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  return trazado
}

/** Ajusta el zoom para que se vea todo el recorrido. */
function Encuadre({ puntos }) {
  const mapa = useMap()
  // Depende del texto de los extremos y la cantidad de puntos, no del arreglo (nuevo en cada render)
  const clave = puntos.length ? `${puntos[0]}|${puntos[puntos.length - 1]}|${puntos.length}` : ''
  useEffect(() => {
    if (puntos.length >= 2) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, clave])
  return null
}

/** Mapa de Colombia con el recorrido entre origen y destino. */
export default function MapaRuta({ origen, destino }) {
  const desde = COORDENADAS[origen]
  const hasta = COORDENADAS[destino]
  const { puntos, real, cargando } = useTrazado(desde, hasta)
  const { t } = useTranslation()

  return (
    <div>
      <div className="h-72 w-full lg:h-80">
        <MapContainer
          center={CENTRO_COLOMBIA}
          zoom={5}
          minZoom={5}
          maxBounds={LIMITES_COLOMBIA}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={TESELAS_OSM}
            maxZoom={19}
          />
          {desde && hasta && (
            <>
              {puntos.length >= 2 && (
                <Polyline
                  positions={puntos}
                  pathOptions={{ color: COLORES.primario, weight: 5, opacity: 0.85, dashArray: real ? undefined : '8 8' }}
                />
              )}
              <CircleMarker center={desde} radius={8} pathOptions={{ color: COLORES.blanco, weight: 2, fillColor: COLORES.primario, fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -8]}>{t('mapa.origen', { municipio: origen })}</Tooltip>
              </CircleMarker>
              <CircleMarker center={hasta} radius={8} pathOptions={{ color: COLORES.blanco, weight: 2, fillColor: COLORES.acento, fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -8]}>{t('mapa.destino', { municipio: destino })}</Tooltip>
              </CircleMarker>
              <Encuadre puntos={puntos} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {t(!desde || !hasta ? 'mapa.sinCoordenadas' : cargando ? 'mapa.calculando' : real ? 'mapa.carretera' : 'mapa.recta')}
      </p>
    </div>
  )
}
