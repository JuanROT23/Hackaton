// Paleta oficial COSCO SHIPPING para lo que se dibuja con JavaScript (gráficos y mapa).
// Los mismos valores están en index.css (@theme) para las clases de Tailwind.
export const COLORES = {
  primario: '#002B66', // azul marino corporativo
  primarioOscuro: '#001D45',
  acento: '#E31B23', // rojo COSCO
  secundario: '#0088CC', // azul claro
  secundarioClaro: '#E6F0FA',
  azulSuave: '#8FB8DE',
  fondo: '#F4F6F9',
  blanco: '#FFFFFF',
  rejilla: '#E2E8F0', // líneas de fondo de los gráficos
}

// Color de cada factor de decisión (donut, sliders, barras de calificación)
export const COLOR_FACTOR = {
  precio: COLORES.primario,
  confiabilidad: COLORES.secundario,
  tiempo: COLORES.acento,
}
