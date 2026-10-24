import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo, /api se reenvía al backend FastAPI (evita problemas de CORS)
const BACKEND = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Recharts sola ocupa ~555 kB (158 kB comprimida); es esperable para esta app
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Librerías grandes en archivos aparte: el navegador las guarda en caché por separado
        manualChunks: {
          mapa: ['leaflet', 'react-leaflet'],
          graficos: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/health': BACKEND,
    },
  },
})
