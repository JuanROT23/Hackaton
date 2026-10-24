// Traducción de la interfaz (español / inglés) con i18next.
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import es from './locales/es'

export const IDIOMAS = ['es', 'en']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    supportedLngs: IDIOMAS,
    fallbackLng: 'es',
    // React ya escapa el texto; i18next no debe hacerlo otra vez
    interpolation: { escapeValue: false },
    detection: {
      // 1° lo que el usuario eligió antes, 2° el idioma del navegador ("en-US" -> "en")
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'cosco-idioma',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => lng.split('-')[0],
    },
  })

// Mantiene <html lang="..."> al día (lectores de pantalla y traductores del navegador)
const marcarIdioma = (lng) => {
  document.documentElement.lang = lng
}
marcarIdioma(i18n.resolvedLanguage)
i18n.on('languageChanged', marcarIdioma)

export default i18n
