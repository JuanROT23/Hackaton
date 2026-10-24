"""Esquemas de entrada y salida de las solicitudes."""
from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.solicitud import (
    EXIGENCIA_CUMPLIMIENTO_DEFECTO,
    PRIORIDAD_PRECIO_DEFECTO,
    TOLERANCIA_RIESGO_DEFECTO,
)


class PrioridadPrecio(str, Enum):
    alta = "Alta"
    media = "Media"
    baja = "Baja"


class ToleranciaRiesgo(str, Enum):
    cero = "Cero tolerancia"
    normal = "Normal"
    flexible = "Flexible"


class ExigenciaCumplimiento(str, Enum):
    alta = "Alta"
    normal = "Normal"


class NivelImportancia(str, Enum):
    """Importancia de un factor para el cliente (Baja = 1, Media = 2, Alta = 3)."""

    baja = "Baja"
    media = "Media"
    alta = "Alta"


class SolicitudCrear(BaseModel):
    """Datos que envía el frontend para simular o registrar una solicitud.

    Con los 3 niveles de importancia se calculan los pesos y el ranking.
    El sistema NO asigna proveedor: la decisión es de operaciones.
    """

    # use_enum_values: al convertir a dict se guarda el texto ("Alta"), no el enum
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    cliente_nombre: str = Field(min_length=1, max_length=100)
    ruta_id: int = Field(gt=0, strict=True)
    # Obligatorio: los filtros de tarifa y disponibilidad dependen del tipo de vehículo
    tipo_vehiculo_id: int = Field(gt=0, strict=True)
    tipo_carga_id: int = Field(gt=0, strict=True)
    peso_kg: float = Field(gt=0, le=50_000)
    volumen_m3: float = Field(gt=0, le=150)
    # Preferencias opcionales: si no se envían se usa el valor por defecto
    prioridad_precio: PrioridadPrecio = PrioridadPrecio(PRIORIDAD_PRECIO_DEFECTO)
    tolerancia_riesgo_seguridad: ToleranciaRiesgo = ToleranciaRiesgo(TOLERANCIA_RIESGO_DEFECTO)
    exigencia_cumplimiento: ExigenciaCumplimiento = ExigenciaCumplimiento(EXIGENCIA_CUMPLIMIENTO_DEFECTO)
    # Importancia de cada factor; si no se envía, vale "Media"
    nivel_precio: NivelImportancia = NivelImportancia.media
    nivel_confiabilidad: NivelImportancia = NivelImportancia.media
    nivel_tiempo: NivelImportancia = NivelImportancia.media

    @field_validator("cliente_nombre")
    @classmethod
    def limpiar_nombre(cls, valor: str) -> str:
        """Quita espacios sobrantes y rechaza vacíos o caracteres de control."""
        valor = valor.strip()
        if not valor:
            raise ValueError("El nombre del cliente no puede estar vacío")
        if any(ord(c) < 32 for c in valor):
            raise ValueError("El nombre del cliente tiene caracteres no permitidos")
        return valor


class SolicitudSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha_solicitud: date
    cliente_nombre: str
    ruta_id: int
    tipo_vehiculo_id: int | None
    tipo_carga_id: int
    peso_kg: float
    volumen_m3: float
    proveedor_asignado_id: int | None
    precio_cotizado_cop: int | None
    tiempo_estimado_h: int | None
    estado: str
    prioridad_precio: str
    tolerancia_riesgo_seguridad: str
    exigencia_cumplimiento: str
    nivel_precio: str | None
    nivel_confiabilidad: str | None
    nivel_tiempo: str | None
    peso_precio: float | None
    peso_confiabilidad: float | None
    peso_tiempo: float | None


class ProveedorRecomendado(BaseModel):
    """Proveedor compatible con el desglose de su puntaje (calificaciones 0-100)."""

    posicion: int
    proveedor_id: int
    nombre: str
    precio_cop: int
    tiempo_estimado_h: int
    vehiculos_disponibles: int
    calificacion_precio: float
    calificacion_confiabilidad: float
    calificacion_tiempo: float
    score_final: float
    puntaje_cumplimiento: float
    fortaleza: str | None
    debilidad: str | None


class DescartadoSalida(BaseModel):
    proveedor_id: int
    nombre: str
    motivo: str


class Simulacion(BaseModel):
    """Respuesta de POST /solicitudes/simular: pesos y ranking, SIN guardar nada."""

    # {"precio": 0.5, "confiabilidad": 0.33, "tiempo": 0.17}: suman 1
    pesos: dict[str, float]
    recomendado: ProveedorRecomendado
    ranking: list[ProveedorRecomendado]
    descartados: list[DescartadoSalida]


class SolicitudConfirmar(SolicitudCrear):
    """Datos de la solicitud más el proveedor que eligió el usuario."""

    proveedor_id: int = Field(gt=0, strict=True)


class SolicitudResumen(BaseModel):
    """Fila del listado de solicitudes, con nombres legibles."""

    id: int
    fecha_solicitud: date
    cliente_nombre: str
    origen: str
    destino: str
    tipo_carga: str
    tipo_vehiculo: str | None
    proveedor: str | None
    peso_kg: float
    precio_cotizado_cop: int | None
    tiempo_estimado_h: int | None
    estado: str


class PaginaSolicitudes(BaseModel):
    items: list[SolicitudResumen]
    total: int
    pagina: int
    tamano: int
