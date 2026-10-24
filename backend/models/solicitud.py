"""Tabla solicitud: pedidos de transporte (proveedor, precio y tiempo quedan nulos hasta adjudicar)."""
from datetime import date

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base

ESTADOS = ("Sin adjudicar", "Por aprobar", "En proceso", "Completada", "Cancelada")
ESTADO_INICIAL = "Sin adjudicar"
# Estado al confirmar desde el frontend: proveedor elegido, pendiente de aprobación
ESTADO_POR_APROBAR = "Por aprobar"
ESTADO_COMPLETADA = "Completada"

# Preferencias del cliente (no vienen en el Excel; las filas cargadas usan el valor por defecto)
PRIORIDADES_PRECIO = ("Alta", "Media", "Baja")
TOLERANCIAS_RIESGO = ("Cero tolerancia", "Normal", "Flexible")
EXIGENCIAS_CUMPLIMIENTO = ("Alta", "Normal")
PRIORIDAD_PRECIO_DEFECTO = "Media"
TOLERANCIA_RIESGO_DEFECTO = "Normal"
EXIGENCIA_CUMPLIMIENTO_DEFECTO = "Normal"

# Importancia que el cliente da a cada factor; de aquí salen los pesos del ranking
NIVELES_IMPORTANCIA = ("Baja", "Media", "Alta")
COLUMNAS_NIVEL = ("nivel_precio", "nivel_confiabilidad", "nivel_tiempo")
COLUMNAS_PESO = ("peso_precio", "peso_confiabilidad", "peso_tiempo")


def _valores_sql(valores: tuple[str, ...]) -> str:
    """('A', 'B') -> "'A', 'B'" para un CHECK ... IN (...) con valores fijos del código."""
    return ", ".join(f"'{v}'" for v in valores)


def _preferencia(defecto: str) -> Mapped[str]:
    """Columna de preferencia con valor por defecto en Python y en la base."""
    return mapped_column(String(20), default=defecto, server_default=defecto)


def _checks_prioridades() -> tuple[CheckConstraint, ...]:
    """CHECK de los niveles de importancia y de los pesos (NULL se permite: filas del Excel)."""
    checks = []
    for c in COLUMNAS_NIVEL:
        checks.append(CheckConstraint(f"{c} IN ({_valores_sql(NIVELES_IMPORTANCIA)})", name=f"ck_solicitud_{c}"))
    for c in COLUMNAS_PESO:
        checks.append(CheckConstraint(f"{c} BETWEEN 0 AND 1", name=f"ck_solicitud_{c}"))
    return tuple(checks)


class Solicitud(Base):
    __tablename__ = "solicitud"
    __table_args__ = (
        CheckConstraint("peso_kg > 0", name="ck_solicitud_peso"),
        CheckConstraint("volumen_m3 > 0", name="ck_solicitud_volumen"),
        CheckConstraint(f"estado IN ({_valores_sql(ESTADOS)})", name="ck_solicitud_estado"),
        CheckConstraint(f"prioridad_precio IN ({_valores_sql(PRIORIDADES_PRECIO)})",
                        name="ck_solicitud_prioridad_precio"),
        CheckConstraint(f"tolerancia_riesgo_seguridad IN ({_valores_sql(TOLERANCIAS_RIESGO)})",
                        name="ck_solicitud_tolerancia_riesgo"),
        CheckConstraint(f"exigencia_cumplimiento IN ({_valores_sql(EXIGENCIAS_CUMPLIMIENTO)})",
                        name="ck_solicitud_exigencia_cumplimiento"),
        *_checks_prioridades(),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    fecha_solicitud: Mapped[date] = mapped_column(index=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100))
    ruta_id: Mapped[int] = mapped_column(ForeignKey("ruta.id"))
    tipo_vehiculo_id: Mapped[int | None] = mapped_column(ForeignKey("tipo_vehiculo.id"))
    tipo_carga_id: Mapped[int] = mapped_column(ForeignKey("tipo_carga.id"))
    peso_kg: Mapped[float]
    volumen_m3: Mapped[float]
    proveedor_asignado_id: Mapped[int | None] = mapped_column(ForeignKey("proveedor.id"))
    precio_cotizado_cop: Mapped[int | None]
    tiempo_estimado_h: Mapped[int | None]
    estado: Mapped[str] = mapped_column(String(15))
    prioridad_precio: Mapped[str] = _preferencia(PRIORIDAD_PRECIO_DEFECTO)
    tolerancia_riesgo_seguridad: Mapped[str] = _preferencia(TOLERANCIA_RIESGO_DEFECTO)
    exigencia_cumplimiento: Mapped[str] = _preferencia(EXIGENCIA_CUMPLIMIENTO_DEFECTO)

    # Importancia de cada factor ('Baja' | 'Media' | 'Alta'). Nulos en las solicitudes del Excel.
    nivel_precio: Mapped[str | None] = mapped_column(String(5))
    nivel_confiabilidad: Mapped[str | None] = mapped_column(String(5))
    nivel_tiempo: Mapped[str | None] = mapped_column(String(5))
    # Pesos resultantes (suman 1)
    peso_precio: Mapped[float | None]
    peso_confiabilidad: Mapped[float | None]
    peso_tiempo: Mapped[float | None]
