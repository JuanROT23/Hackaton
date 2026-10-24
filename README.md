# COSCO Shipping - Sistema de Selección Inteligente de Proveedores

## Descripción del Proyecto
Sistema de apoyo a la toma de decisiones para el equipo de operaciones de COSCO Shipping en Colombia. Permite evaluar y rankear de manera rápida, transparente y basada en datos al proveedor de transporte terrestre más adecuado para cada solicitud, ponderando precio, seguridad/confiabilidad y tiempo.

## Equipo
* Juan Ortiz, Samuel Puentes, Mariana Orjuela, Cesar Cardona, Samuel Murillo

## Estructura del Repositorio
* `COSCO_Colombia_Relacional_SINTETICA_2024_2026.xlsx` -> Dataset relacional sintético del reto (se usa
  localmente para poblar la base; está en `.gitignore` y no se sube al repositorio).
* `backend/` -> API en FastAPI + SQLite.
* `frontend/` -> Interfaz "COSCO Decision Hub" en React (Vite) + Tailwind, con Recharts y Leaflet.

## Puesta en marcha rápida (dos terminales PowerShell)

```powershell
# Terminal 1: backend (http://127.0.0.1:8000)
cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload

# Terminal 2: frontend (http://localhost:5173)
cd frontend; npm install; npm run dev
```

Requiere Python 3.10+ y Node.js 20+ (LTS). En desarrollo, Vite reenvía `/api` al backend, así que no hay
que configurar CORS. `npm run build` genera la versión de producción en `frontend/dist/`.

**Flujo:** en *Solicitudes* → "Crear Nueva Solicitud" → datos + importancia de precio, confiabilidad y
tiempo → "Calcular y Simular Recomendación" (no guarda nada) → vista de análisis con mapa, pesos y Top 3 →
elegir transportadora →
"Confirmar y Asignar Solicitud" (se guarda en estado **Por aprobar** con el proveedor, precio y tiempo de su
tarifa). *Resumen* muestra las solicitudes activas (todas menos las Completadas) y *Transportadoras* los
puntajes base.

> Si se cambia un modelo de la base, hay que borrar `backend/cosco_shipping.db` y volver a correr
> `python -m scripts.seed` (no hay migraciones).

```
backend/
  main.py          aplicación FastAPI, CORS y rutas bajo /api/v1
  config/          settings.py (variables de entorno) y database.py (SQLAlchemy + SQLite)
  models/          un archivo por tabla (9 tablas)
  schemas/         validación de entrada y forma de las respuestas (Pydantic)
  routes/          catalogos.py, proveedores.py, solicitudes.py
  scripts/seed.py  carga el Excel sintético en cosco_shipping.db
```

## Instalación (PowerShell, Windows)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Si PowerShell bloquea `Activate.ps1`: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
Opcional: `Copy-Item .env.example .env` para cambiar la ruta de la base, del Excel o el origen del frontend.

## Uso (desde `backend/` con el entorno activado)

```powershell
python -m scripts.seed          # crea cosco_shipping.db desde el Excel (borra y recarga)
uvicorn main:app --reload       # API en http://127.0.0.1:8000  (documentación en /docs)
```

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Comprueba que la API está viva |
| GET | `/api/v1/rutas` | Rutas operativas (origen Buenaventura o Cartagena) |
| GET | `/api/v1/tipos-carga` | Tipos de carga |
| GET | `/api/v1/tipos-vehiculo` | Tipos de vehículo |
| GET | `/api/v1/proveedores` | Proveedores con su puntaje base (0-100) |
| POST | `/api/v1/solicitudes/simular` | Calcula los pesos y el ranking **sin guardar** |
| POST | `/api/v1/solicitudes` | Guarda la solicitud con `proveedor_id` elegido, en estado "Por aprobar" |
| GET | `/api/v1/solicitudes?activas=&estado=&pagina=&tamano=` | Listado paginado con nombres legibles |
| GET | `/api/v1/solicitudes/conteo` | Cantidad de solicitudes por estado |

Ejemplo de cuerpo para `POST /api/v1/solicitudes/simular` (para confirmar se agrega `proveedor_id`):

```json
{ "cliente_nombre": "Cliente sintético 001", "ruta_id": 102, "tipo_vehiculo_id": 2,
  "tipo_carga_id": 2, "peso_kg": 3000, "volumen_m3": 15,
  "nivel_precio": "Alta", "nivel_confiabilidad": "Media", "nivel_tiempo": "Baja" }
```

Los 3 niveles aceptan `Baja`, `Media` o `Alta` y son opcionales (si faltan valen `Media`). Ids inexistentes
devuelven 404 y datos inválidos 422. (El campo `urgencia` se eliminó: la rapidez ya se pondera con
`nivel_tiempo`; el seed descarta esa columna del Excel.)

**Rutas operativas:** solo se usan rutas cuyo **origen** es Buenaventura o Cartagena (39 rutas: 9 y 30).
`GET /api/v1/rutas` entrega únicamente esas, y `/simular` y la confirmación responden 422 si llega otra
ruta. Los puertos se definen en `PUERTOS_ORIGEN` (`backend/config/settings.py`) y en `PUERTOS_COSCO`
(`frontend/src/data/municipios.js`); si se cambian, hay que cambiar ambos. Las prioridades se eligen con una línea deslizante de 3 posiciones
(Baja, Media, Alta) que muestra el % en vivo.

El mapa de la vista de análisis usa teselas de CARTO/OpenStreetMap y pide el recorrido por carretera al
servicio público OSRM; si no responde, dibuja una línea recta punteada. Ambos requieren internet.

Preferencias del cliente (opcionales; si no se envían se usa el valor por defecto):

| Campo | Valores | Por defecto |
|---|---|---|
| `prioridad_precio` | `Alta`, `Media`, `Baja` | `Media` |
| `tolerancia_riesgo_seguridad` | `Cero tolerancia`, `Normal`, `Flexible` | `Normal` |
| `exigencia_cumplimiento` | `Alta`, `Normal` | `Normal` |

El Excel no trae estas columnas: el seed asigna los valores por defecto a las 1.300 solicitudes cargadas.

## Cómo se calcula la recomendación (POST /api/v1/solicitudes)

**1. Pesos según la importancia.** Cada factor se marca como `Baja` (1), `Media` (2) o `Alta` (3), y
cada peso es su valor dividido por la suma de los tres (siempre suman 100 %):

```
w_precio        = val_precio        / (val_precio + val_confiabilidad + val_tiempo)
w_confiabilidad = val_confiabilidad / (val_precio + val_confiabilidad + val_tiempo)
w_tiempo        = val_tiempo        / (val_precio + val_confiabilidad + val_tiempo)
```

Ejemplo: precio Alta (3), confiabilidad Media (2), tiempo Baja (1) → suma 6 → **50 %, 33,3 %, 16,7 %**.
Los tres en el mismo nivel dan 33,3 % cada uno.

**2. Filtros duros.** La carga debe caber en el tipo de vehículo pedido (peso y volumen), la carga
refrigerada solo va en vehículo refrigerado y la carga peligrosa no se acepta (el dataset no modela
certificaciones). Cada proveedor debe estar activo, tener tarifa para la ruta y ese vehículo, y al
menos un vehículo de ese tipo disponible. Cada proveedor descartado trae **todos** sus motivos concretos
(p. ej. "Cubre la ruta, pero no con Tractomula (ofrece: NHR, Sencillo)" o "Sin vehículos tipo NHR
disponibles (3 en flota, todos ocupados)"). Si nadie pasa, la API responde **409** con los motivos y no guarda.

**3. Calificaciones 0-100 y score.**

* Precio P = 100 × tarifa más baja entre los compatibles / tarifa del proveedor.
* Confiabilidad C = promedio de `puntaje_seguridad` y % de servicios históricos sin incidentes.
* Tiempo T = promedio de `puntaje_cumplimiento` y `puntaje_tiempo`.
* **S = w_precio·P + w_confiabilidad·C + w_tiempo·T**, de mayor a menor (en empate, el más barato).

`/simular` devuelve los pesos, el proveedor recomendado (Top 1), el ranking completo con su desglose,
fortaleza y debilidad, y los descartados con su motivo, sin guardar nada. Al confirmar, el backend vuelve
a evaluar: si el proveedor elegido ya no es compatible responde 409. La decisión final es de operaciones.

Pruebas: `pytest` (desde `backend/`).

## Criterios de Evaluación Cubiertos
1. **Calidad de la recomendación:** Ponderación multicriterio basada en las prioridades de la gerencia.
2. **Transparencia y Explicabilidad:** Desglose del porqué un proveedor encabeza el ranking.
3. **Análisis de Datos:** Uso de histórico operativo simulado 2024-2026 para tableros y toma de decisiones.
