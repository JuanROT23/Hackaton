import { Anchor, BarChart3, ClipboardList, Headset, LayoutDashboard } from 'lucide-react'

export const PESTANAS = [
  { id: 'resumen', etiqueta: 'Resumen', icono: LayoutDashboard },
  { id: 'solicitudes', etiqueta: 'Solicitudes', icono: ClipboardList },
  { id: 'transportadoras', etiqueta: 'Transportadoras / Seguimiento', icono: BarChart3 },
]

/** Barra corporativa + encabezado con el nombre de la app y las 3 pestañas (fijo al hacer scroll). */
export default function Header({ activa, onCambiar, onSoporte }) {
  return (
    <header className="sticky top-0 z-[1100] shadow-lg">
      {/* Barra corporativa superior */}
      <div className="bg-cosco-950 text-[11px] text-cosco-100/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
          <span className="hidden font-medium tracking-wide sm:inline">COSCO SHIPPING · Colombia</span>
          <button type="button" onClick={onSoporte} className="ml-auto flex items-center gap-1 font-semibold tracking-wider hover:text-white">
            <Headset className="h-3.5 w-3.5" aria-hidden /> SOPORTE
          </button>
        </div>
      </div>

      {/* Encabezado principal */}
      <div className="bg-cosco-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-3 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3 pb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-acento shadow-md ring-2 ring-white/30">
              <Anchor className="h-6 w-6 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                COSCO <span className="font-semibold text-cosco-100">Decision Hub</span>
              </h1>
              <p className="font-script text-lg leading-tight text-cosco-100">Conectando puertos con decisiones inteligentes</p>
            </div>
          </div>

          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Secciones">
            {PESTANAS.map(({ id, etiqueta, icono: Icono }) => {
              const seleccionada = id === activa
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCambiar(id)}
                  aria-current={seleccionada ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-t-2 px-4 py-2.5 text-sm font-medium transition ${
                    seleccionada
                      ? 'border-acento bg-fondo text-cosco-900'
                      : 'border-transparent text-cosco-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icono className="h-4 w-4" aria-hidden />
                  {etiqueta}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
