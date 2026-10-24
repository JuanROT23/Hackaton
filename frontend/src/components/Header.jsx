import { BarChart3, ClipboardList, Globe, Headset, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IDIOMAS } from '../i18n'

// El texto de cada pestaña sale del diccionario: header.pestanas.<id>
export const PESTANAS = [
  { id: 'resumen', icono: LayoutDashboard },
  { id: 'solicitudes', icono: ClipboardList },
  { id: 'transportadoras', icono: BarChart3 },
]

/** Interruptor ES | EN: el idioma activo queda resaltado en blanco. */
function SelectorIdioma() {
  const { t, i18n } = useTranslation()
  const actual = i18n.resolvedLanguage
  return (
    <div role="group" aria-label={t('idioma.etiqueta')} className="flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <div className="flex rounded-full bg-white/10 p-0.5 ring-1 ring-white/20">
        {IDIOMAS.map((lng) => {
          const activo = lng === actual
          return (
            <button
              key={lng}
              type="button"
              onClick={() => i18n.changeLanguage(lng)}
              aria-pressed={activo}
              title={t(`idioma.${lng}`)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider transition ${
                activo ? 'bg-white text-cosco-900 shadow-sm' : 'text-cosco-100/80 hover:text-white'
              }`}
            >
              {lng.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Barra corporativa + encabezado con el nombre de la app y las 3 pestañas (fijo al hacer scroll). */
export default function Header({ activa, onCambiar, onSoporte }) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-[1100] shadow-lg">
      {/* Barra corporativa superior */}
      <div className="bg-cosco-950 text-[11px] text-cosco-100/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
          <span className="hidden font-medium tracking-wide sm:inline">{t('header.pais')}</span>
          <div className="ml-auto flex items-center gap-5">
            <SelectorIdioma />
            <button type="button" onClick={onSoporte} className="flex items-center gap-1 font-semibold tracking-wider hover:text-white">
              <Headset className="h-3.5 w-3.5" aria-hidden /> {t('header.soporte')}
            </button>
          </div>
        </div>
      </div>

      {/* Encabezado principal */}
      <div className="bg-cosco-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-3 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3 pb-3">
            {/* Fondo blanco: el azul oscuro del logo casi no se ve sobre el azul marino del header */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white/30">
              <img src="/logo-red.png" className="h-10 w-10 object-contain" alt="COSCO Decision Hub" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                COSCO <span className="font-semibold text-cosco-100">Decision Hub</span>
              </h1>
              <p className="font-script text-lg leading-tight text-cosco-100">{t('header.eslogan')}</p>
            </div>
          </div>

          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={t('header.secciones')}>
            {PESTANAS.map(({ id, icono: Icono }) => {
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
                  {t(`header.pestanas.${id}`)}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
