import { Calculator, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PUERTOS_COSCO } from '../data/municipios'
import { formatoPct, localeActual } from '../utils/formato'
import { tCatalogo, tError } from '../utils/traducir'
import { CRITERIOS } from './DonutPesos'
import { Alerta, Boton } from './ui'

// Posición del slider (1, 2, 3) -> nivel. Mismo cálculo que el backend: se divide por la suma.
// Estos valores van a la API y NO se traducen; solo se traduce lo que se muestra (solicitud.niveles.*)
const NIVELES = ['Baja', 'Media', 'Alta']
const VALOR_NIVEL = { Baja: 1, Media: 2, Alta: 3 }

// El título de cada slider sale del diccionario: solicitud.importancia.<clave>
const PRIORIDADES = [
  { campo: 'nivel_precio', clave: 'precio' },
  { campo: 'nivel_confiabilidad', clave: 'confiabilidad' },
  { campo: 'nivel_tiempo', clave: 'tiempo' },
]

export const FORMULARIO_VACIO = {
  cliente_nombre: '',
  peso_kg: '',
  volumen_m3: '',
  ruta_id: '',
  tipo_vehiculo_id: '',
  tipo_carga_id: '',
  nivel_precio: 'Media',
  nivel_confiabilidad: 'Media',
  nivel_tiempo: 'Media',
}

/** Solo rutas que SALEN de un puerto COSCO, agrupadas por puerto: [[puerto, rutas], ...].
 *  El backend ya entrega solo estas rutas; el filtro se repite aquí por seguridad. */
function rutasOperativas(rutas) {
  return PUERTOS_COSCO.map((puerto) => [
    puerto,
    rutas
      .filter((r) => r.origen_municipio === puerto)
      .sort((a, b) => a.destino_municipio.localeCompare(b.destino_municipio)),
  ]).filter(([, lista]) => lista.length > 0)
}

/** Pesos (%) que resultan de los 3 niveles, para mostrarlos antes de simular. */
function pesosPrevios(form) {
  const valores = PRIORIDADES.map(({ campo }) => VALOR_NIVEL[form[campo]])
  const total = valores.reduce((a, b) => a + b, 0)
  return Object.fromEntries(PRIORIDADES.map(({ clave }, i) => [clave, valores[i] / total]))
}

/** Valida en el navegador y convierte el formulario al cuerpo que espera la API.
 *  Los errores son claves (solicitud.faltantes.*) para traducirlos al mostrarlos. */
function aCuerpoApi(f) {
  const errores = []
  if (!f.cliente_nombre.trim()) errores.push('cliente')
  if (!(Number(f.peso_kg) > 0)) errores.push('peso')
  if (!(Number(f.volumen_m3) > 0)) errores.push('volumen')
  if (!f.ruta_id) errores.push('ruta')
  if (!f.tipo_vehiculo_id) errores.push('tipoVehiculo')
  if (!f.tipo_carga_id) errores.push('tipoCarga')
  if (errores.length) return { errores }
  return {
    cuerpo: {
      cliente_nombre: f.cliente_nombre.trim(),
      peso_kg: Number(f.peso_kg),
      volumen_m3: Number(f.volumen_m3),
      ruta_id: Number(f.ruta_id),
      tipo_vehiculo_id: Number(f.tipo_vehiculo_id),
      tipo_carga_id: Number(f.tipo_carga_id),
      nivel_precio: f.nivel_precio,
      nivel_confiabilidad: f.nivel_confiabilidad,
      nivel_tiempo: f.nivel_tiempo,
    },
  }
}

function Campo({ etiqueta, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{etiqueta}</span>
      {children}
    </label>
  )
}

/** Línea deslizante de 3 posiciones: Baja (izquierda), Media (centro), Alta (derecha). */
function SelectorNivel({ nombre, titulo, valor, peso, color, onCambiar }) {
  const { t } = useTranslation()
  const posicion = VALOR_NIVEL[valor]
  // Relleno de la línea hasta la posición actual (0 %, 50 % o 100 %)
  const relleno = `${((posicion - 1) / 2) * 100}%`
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="mb-1 text-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{formatoPct(peso)}</span>
      </div>
      <label htmlFor={nombre} className="mb-3 block text-center text-sm font-medium text-slate-700">
        {titulo}
      </label>
      <input
        id={nombre}
        type="range"
        min="1"
        max="3"
        step="1"
        value={posicion}
        onChange={(e) => onCambiar(NIVELES[Number(e.target.value) - 1])}
        aria-valuetext={t(`solicitud.niveles.${valor}`)}
        className="slider-nivel w-full"
        style={{ '--color-slider': color, '--relleno': relleno }}
      />
      <div className="mt-1 flex justify-between text-xs" aria-hidden>
        {NIVELES.map((nivel) => (
          <button
            key={nivel}
            type="button"
            tabIndex={-1}
            onClick={() => onCambiar(nivel)}
            className={nivel === valor ? 'font-semibold text-slate-900' : 'text-slate-400 hover:text-slate-600'}
          >
            {t(`solicitud.niveles.${nivel}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

const ESTILO_CAMPO =
  'w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-cosco-600 focus:outline-none'

/** Formulario de nueva solicitud: datos operativos + importancia de precio, confiabilidad y tiempo. */
export default function SolicitudForm({ catalogos, inicial, enviando, errorApi, onSimular }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(inicial ?? FORMULARIO_VACIO)
  const [errores, setErrores] = useState([])
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const gruposRutas = useMemo(() => rutasOperativas(catalogos.rutas), [catalogos.rutas])
  const pesos = pesosPrevios(form)

  const enviar = (e) => {
    e.preventDefault()
    const { errores: faltan, cuerpo } = aCuerpoApi(form)
    setErrores(faltan ?? [])
    if (cuerpo) onSimular(cuerpo, form)
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('solicitud.seccionDatos')}</h3>
        <div className="grid gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta={t('solicitud.cliente')}>
            <input className={ESTILO_CAMPO} maxLength={100} value={form.cliente_nombre} onChange={cambiar('cliente_nombre')} />
          </Campo>
          <Campo etiqueta={t('solicitud.peso')}>
            <input className={ESTILO_CAMPO} type="number" min="1" max="50000" step="any" value={form.peso_kg} onChange={cambiar('peso_kg')} />
          </Campo>
          <Campo etiqueta={t('solicitud.volumen')}>
            <input className={ESTILO_CAMPO} type="number" min="0.01" max="150" step="any" value={form.volumen_m3} onChange={cambiar('volumen_m3')} />
          </Campo>
          <div className="sm:col-span-2 lg:col-span-1">
            <Campo etiqueta={t('solicitud.ruta')}>
              <select className={ESTILO_CAMPO} value={form.ruta_id} onChange={cambiar('ruta_id')}>
                <option value="">{t('solicitud.seleccione')}</option>
                {gruposRutas.map(([puerto, rutas]) => (
                  <optgroup key={puerto} label={t('solicitud.desdePuerto', { puerto })}>
                    {rutas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.origen_municipio} → {r.destino_municipio} ({r.distancia_km} km)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>
          </div>
          <Campo etiqueta={t('solicitud.tipoVehiculo')}>
            <select className={ESTILO_CAMPO} value={form.tipo_vehiculo_id} onChange={cambiar('tipo_vehiculo_id')}>
              <option value="">{t('solicitud.seleccione')}</option>
              {catalogos.tiposVehiculo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tCatalogo(t, tipo.nombre)} ·{' '}
                  {t('solicitud.capacidad', { peso: tipo.peso_max_kg.toLocaleString(localeActual()), volumen: tipo.volumen_max_m3 })}
                  {tipo.es_refrigerado ? ` · ${t('solicitud.refrigerado')}` : ''}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta={t('solicitud.tipoCarga')}>
            <select className={ESTILO_CAMPO} value={form.tipo_carga_id} onChange={cambiar('tipo_carga_id')}>
              <option value="">{t('solicitud.seleccione')}</option>
              {catalogos.tiposCarga.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tCatalogo(t, tipo.nombre)}
                  {tipo.requiere_refrigeracion ? ` (${t('solicitud.refrigerada')})` : ''}
                  {tipo.es_peligrosa ? ` (${t('solicitud.peligrosa')})` : ''}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('solicitud.seccionPrioridades')}</h3>
        <p className="mb-3 text-sm text-slate-500">{t('solicitud.ayudaPrioridades')}</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {PRIORIDADES.map(({ campo, clave }) => (
            <SelectorNivel
              key={campo}
              nombre={campo}
              titulo={t(`solicitud.importancia.${clave}`)}
              valor={form[campo]}
              peso={pesos[clave]}
              color={CRITERIOS.find((c) => c.clave === clave).color}
              onCambiar={(nivel) => setForm((f) => ({ ...f, [campo]: nivel }))}
            />
          ))}
        </div>
      </section>

      {errores.length > 0 && (
        <Alerta>
          {t('solicitud.faltaCompletar', { campos: errores.map((e) => t(`solicitud.faltantes.${e}`)).join(', ') })}
        </Alerta>
      )}
      {errorApi && <Alerta>{tError(t, errorApi)}</Alerta>}

      <div className="flex justify-end">
        <Boton type="submit" disabled={enviando} className="px-6">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Calculator className="h-4 w-4" aria-hidden />}
          {t('solicitud.simular')}
        </Boton>
      </div>
    </form>
  )
}
