import { Headset, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const PASOS = ['paso1', 'paso2', 'paso3', 'paso4']

/** Botón circular rojo fijo abajo a la derecha, con un panel de ayuda rápida. */
export default function BotonSoporte({ abierto, onAbrir, onCerrar }) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!abierto) return undefined
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [abierto, onCerrar])

  return (
    <div className="fixed bottom-5 right-5 z-[1150] flex flex-col items-end gap-3">
      {abierto && (
        <div role="dialog" aria-label={t('soporte.titulo')} className="w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-cosco-900 px-4 py-3 text-white">
            <p className="flex items-center gap-2 font-semibold">
              <Headset className="h-4 w-4" aria-hidden /> {t('soporte.titulo')}
            </p>
            <button type="button" onClick={onCerrar} className="rounded p-1 hover:bg-white/10" aria-label={t('soporte.cerrar')}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="space-y-2 p-4 text-sm text-slate-700">
            {PASOS.map((paso, i) => (
              <li key={paso} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cosco-50 text-xs font-bold text-cosco-900">
                  {i + 1}
                </span>
                {t(`soporte.${paso}`)}
              </li>
            ))}
          </ol>
          <p className="border-t border-slate-100 bg-fondo px-4 py-3 text-xs text-slate-500">{t('soporte.nota')}</p>
        </div>
      )}
      <button
        type="button"
        onClick={abierto ? onCerrar : onAbrir}
        aria-expanded={abierto}
        aria-label={abierto ? t('soporte.cerrar') : t('soporte.abrir')}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-acento text-white shadow-xl ring-4 ring-white transition hover:scale-105 hover:bg-acento-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cosco-600"
      >
        {abierto ? <X className="h-6 w-6" aria-hidden /> : <Headset className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  )
}
