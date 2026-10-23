# COSCO Shipping - Sistema de Selección Inteligente de Proveedores

## Descripción del Proyecto
Sistema de apoyo a la toma de decisiones para el equipo de operaciones de COSCO Shipping en Colombia. Permite evaluar y rankear de manera rápida, transparente y basada en datos al proveedor de transporte terrestre más adecuado para cada solicitud, ponderando precio, seguridad/confiabilidad y tiempo.

## Equipo
* Juan Ortiz, Samuel Puentes, Mariana Orjuela, Cesar Cardona, Samuel Murillo

## Estructura del Repositorio
* `/data` -> Contiene el archivo histórico simulado (`COSCO_Bogota_SIMULADA_2022_2026.xlsx`).
* `/src` -> Código fuente del motor de recomendación y la interfaz.

## Criterios de Evaluación Cubiertos
1. **Calidad de la recomendación:** Ponderación multicriterio basada en las prioridades de la gerencia.
2. **Transparencia y Explicabilidad:** Desglose del porqué un proveedor encabeza el ranking.
3. **Análisis de Datos:** Uso de histórico operativo simulado 2022-2026 para tableros y toma de decisiones.
