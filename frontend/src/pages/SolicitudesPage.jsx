import { ClipboardList, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import SolicitudForm from '../components/SolicitudForm'
import TablaSolicitudes from '../components/TablaSolicitudes'
import { Alerta, Boton, Cargando, Modal, Paginacion, Tarjeta } from '../components/ui'
import { api } from '../services/api'
import { idBorrador } from '../utils/formato'
import AnalisisSimulacion from './AnalisisSimulacion'

const ESTADOS = ['', 'Sin adjudicar', 'Por aprobar', 'En proceso', 'Completada', 'Cancelada']
const TAMANO = 15

/** Gestión de solicitudes: listado, creación, simulación y asignación. */
export default function SolicitudesPage({ catalogos }) {
  const [vista, setVista] = useState('lista') // 'lista' | 'analisis'
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formulario, setFormulario] = useState(null) // lo que el usuario escribió, para poder editar
  const [cuerpo, setCuerpo] = useState(null) // lo que se envía a la API
  const [simulacion, setSimulacion] = useState(null)
  const [borrador, setBorrador] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [errorApi, setErrorApi] = useState('')
  const [exito, setExito] = useState('')

  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [recarga, setRecarga] = useState(0) // se incrementa para volver a pedir el listado
  const [listado, setListado] = useState(null)
  const [errorListado, setErrorListado] = useState('')

  useEffect(() => {
    let vigente = true // evita mostrar una respuesta vieja si llega tarde
    setErrorListado('')
    api.solicitudes({ estado: estado || undefined, pagina, tamano: TAMANO })
      .then((datos) => vigente && setListado(datos))
      .catch((e) => vigente && setErrorListado(e.message))
    return () => {
      vigente = false
    }
  }, [estado, pagina, recarga])

  const simular = async (datos, form) => {
    setOcupado(true)
    setErrorApi('')
    try {
      const resultado = await api.simularSolicitud(datos)
      setCuerpo(datos)
      setFormulario(form)
      setSimulacion(resultado)
      setBorrador(idBorrador())
      setModalAbierto(false)
      setVista('analisis')
    } catch (e) {
      setErrorApi(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const confirmar = async (proveedor) => {
    setOcupado(true)
    setErrorApi('')
    try {
      const guardada = await api.confirmarSolicitud(cuerpo, proveedor.proveedor_id)
      setExito(`Solicitud #${guardada.id} asignada a ${proveedor.nombre} en estado "${guardada.estado}".`)
      setVista('lista')
      setSimulacion(null)
      setFormulario(null)
      setPagina(1)
      setRecarga((n) => n + 1)
    } catch (e) {
      setErrorApi(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const abrirNueva = () => {
    setFormulario(null)
    setErrorApi('')
    setExito('')
    setModalAbierto(true)
  }

  if (vista === 'analisis' && simulacion) {
    return (
      <AnalisisSimulacion
        borrador={borrador}
        simulacion={simulacion}
        ruta={catalogos.rutas.find((r) => r.id === cuerpo.ruta_id)}
        carga={catalogos.tiposCarga.find((t) => t.id === cuerpo.tipo_carga_id)}
        vehiculo={catalogos.tiposVehiculo.find((t) => t.id === cuerpo.tipo_vehiculo_id)}
        confirmando={ocupado}
        errorApi={errorApi}
        onConfirmar={confirmar}
        onVolver={() => {
          setErrorApi('')
          setVista('lista')
          setModalAbierto(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-cosco-950">Nueva solicitud de transporte</h2>
        <p className="max-w-xl text-sm text-slate-500">
          Registre los datos de la carga y las prioridades del cliente. El sistema ordena y explica las transportadoras
          compatibles; usted decide a quién asignar.
        </p>
        <Boton onClick={abrirNueva} className="mt-2 px-6 py-3 text-base">
          <Plus className="h-5 w-5" aria-hidden /> Crear Nueva Solicitud
        </Boton>
      </div>

      {exito && <Alerta tipo="exito" onCerrar={() => setExito('')}>{exito}</Alerta>}

      <Tarjeta
        titulo="Historial de solicitudes"
        icono={ClipboardList}
        acciones={
          <select
            aria-label="Filtrar por estado"
            className="rounded-lg border-0 bg-white px-3 py-1.5 text-sm ring-1 ring-slate-300"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value)
              setPagina(1)
            }}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e || 'Todos los estados'}</option>
            ))}
          </select>
        }
      >
        {errorListado && <Alerta>{errorListado}</Alerta>}
        {!listado && !errorListado && <Cargando />}
        {listado && (
          <>
            <TablaSolicitudes solicitudes={listado.items} />
            <Paginacion pagina={pagina} tamano={TAMANO} total={listado.total} onCambiar={setPagina} />
          </>
        )}
      </Tarjeta>

      <Modal titulo="Crear nueva solicitud" abierto={modalAbierto} onCerrar={() => setModalAbierto(false)}>
        <SolicitudForm
          key={formulario ? 'editar' : 'nueva'}
          catalogos={catalogos}
          inicial={formulario}
          enviando={ocupado}
          errorApi={errorApi}
          onSimular={simular}
        />
      </Modal>
    </div>
  )
}
