import { Calculator, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PUERTOS_COSCO } from '../data/municipios'
import { formatoPct } from '../utils/formato'
import { CRITERIOS } from './DonutPesos'
import { Alerta, Boton } from './ui'

// Posición del slider (1, 2, 3) -> nivel. Mismo cálculo que el backend: se divide por la suma
const NIVELES = ['Baja', 'Media', 'Alta']
const VALOR_NIVEL = { Baja: 1, Media: 2, Alta: 3 }

const PRIORIDADES = [
  { campo: 'nivel_precio', clave: 'precio', titulo: 'Importancia del precio' },
  { campo: 'nivel_confiabilidad', clave: 'confiabilidad', titulo: 'Importancia de la confiabilidad' },
  { campo: 'nivel_tiempo', clave: 'tiempo', titulo: 'Importancia del cumplimiento de tiempo' },
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

/** Solo rutas que SALEN de un puerto COSCO, agrupadas por puerto: [[etiqueta, rutas], ...].
 *  El backend ya entrega solo estas rutas; el filtro se repite aquí por seguridad. */
function rutasOperativas(rutas) {
  return PUERTOS_COSCO.map((puerto) => [
    `⚓ Desde ${puerto}`,
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

/** Valida en el navegador y convierte el formulario al cuerpo que espera la API. */
function aCuerpoApi(f) {
  const errores = []
  if (!f.cliente_nombre.trim()) errores.push('el nombre del cliente')
  if (!(Number(f.peso_kg) > 0)) errores.push('un peso mayor a 0')
  if (!(Number(f.volumen_m3) > 0)) errores.push('un volumen mayor a 0')
  if (!f.ruta_id) errores.push('la ruta')
  if (!f.tipo_vehiculo_id) errores.push('el tipo de vehículo')
  if (!f.tipo_carga_id) errores.push('el tipo de carga')
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
        aria-valuetext={valor}
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
            {nivel}
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
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">A. Datos operativos</h3>
        <div className="grid gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Nombre del cliente">
            <input className={ESTILO_CAMPO} maxLength={100} value={form.cliente_nombre} onChange={cambiar('cliente_nombre')} />
          </Campo>
          <Campo etiqueta="Peso (kg)">
            <input className={ESTILO_CAMPO} type="number" min="1" max="50000" step="any" value={form.peso_kg} onChange={cambiar('peso_kg')} />
          </Campo>
          <Campo etiqueta="Volumen (m³)">
            <input className={ESTILO_CAMPO} type="number" min="0.01" max="150" step="any" value={form.volumen_m3} onChange={cambiar('volumen_m3')} />
          </Campo>
          <div className="sm:col-span-2 lg:col-span-1">
            <Campo etiqueta="Ruta (origen → destino)">
              <select className={ESTILO_CAMPO} value={form.ruta_id} onChange={cambiar('ruta_id')}>
                <option value="">Seleccione…</option>
                {gruposRutas.map(([grupo, rutas]) => (
                  <optgroup key={grupo} label={grupo}>
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
          <Campo etiqueta="Tipo de vehículo">
            <select className={ESTILO_CAMPO} value={form.tipo_vehiculo_id} onChange={cambiar('tipo_vehiculo_id')}>
              <option value="">Seleccione…</option>
              {catalogos.tiposVehiculo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · hasta {t.peso_max_kg.toLocaleString('es-CO')} kg / {t.volumen_max_m3} m³
                  {t.es_refrigerado ? ' · refrigerado' : ''}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Tipo de carga">
            <select className={ESTILO_CAMPO} value={form.tipo_carga_id} onChange={cambiar('tipo_carga_id')}>
              <option value="">Seleccione…</option>
              {catalogos.tiposCarga.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                  {t.requiere_refrigeracion ? ' (refrigerada)' : ''}
                  {t.es_peligrosa ? ' (peligrosa)' : ''}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">B. Prioridades del cliente</h3>
        <p className="mb-3 text-sm text-slate-500">
          Deslice cada línea según qué tan importante es el factor. El porcentaje muestra cuánto pesará en el ranking.
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {PRIORIDADES.map(({ campo, clave, titulo }) => (
            <SelectorNivel
              key={campo}
              nombre={campo}
              titulo={titulo}
              valor={form[campo]}
              peso={pesos[clave]}
              color={CRITERIOS.find((c) => c.clave === clave).color}
              onCambiar={(nivel) => setForm((f) => ({ ...f, [campo]: nivel }))}
            />
          ))}
        </div>
      </section>

      {errores.length > 0 && <Alerta>Falta completar: {errores.join(', ')}.</Alerta>}
      {errorApi && <Alerta>{errorApi}</Alerta>}

      <div className="flex justify-end">
        <Boton type="submit" disabled={enviando} className="px-6">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Calculator className="h-4 w-4" aria-hidden />}
          Calcular y Simular Recomendación
        </Boton>
      </div>
    </form>
  )
}
