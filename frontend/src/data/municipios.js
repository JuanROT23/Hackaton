// Coordenadas aproximadas (centro urbano) de los municipios de las rutas.
// Datos geográficos públicos, solo para dibujar el mapa.
export const COORDENADAS = {
  Armenia: [4.5339, -75.6811],
  Barranquilla: [10.9685, -74.7813],
  Bogotá: [4.711, -74.0721],
  Bucaramanga: [7.1193, -73.1227],
  Buenaventura: [3.8801, -77.0312],
  Cali: [3.4516, -76.532],
  Cartagena: [10.391, -75.4794],
  Cúcuta: [7.8939, -72.5078],
  Funza: [4.7166, -74.2117],
  Ibagué: [4.4389, -75.2322],
  Ipiales: [0.8303, -77.6444],
  Itagüí: [6.1719, -75.6114],
  Manizales: [5.0703, -75.5138],
  Medellín: [6.2442, -75.5812],
  Montería: [8.7479, -75.8814],
  Mosquera: [4.7059, -74.2302],
  Neiva: [2.9273, -75.2819],
  Palmira: [3.5394, -76.3036],
  Pasto: [1.2136, -77.2811],
  Pereira: [4.8133, -75.6961],
  Popayán: [2.4448, -76.6147],
  Riohacha: [11.5444, -72.9072],
  Rionegro: [6.1551, -75.3737],
  'Santa Marta': [11.2408, -74.199],
  Sincelejo: [9.3047, -75.3978],
  Soacha: [4.5794, -74.2168],
  Tocancipá: [4.9653, -73.913],
  Tunja: [5.5353, -73.3678],
  Valledupar: [10.4631, -73.2532],
  Villavicencio: [4.142, -73.6266],
  Yopal: [5.3378, -72.3959],
}

// Puertos de salida de COSCO SHIPPING en Colombia. El selector de rutas solo muestra
// las rutas cuyo ORIGEN es uno de estos puertos, en este orden (igual que el backend).
export const PUERTOS_COSCO = ['Buenaventura', 'Cartagena']

// Centro aproximado de Colombia continental, por si falta alguna coordenada
export const CENTRO_COLOMBIA = [4.6, -74.1]
