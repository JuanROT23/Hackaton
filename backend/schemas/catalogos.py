"""Esquemas de salida de los catálogos y proveedores."""
from datetime import date

from pydantic import BaseModel, ConfigDict


class Salida(BaseModel):
    """Base: permite construir la respuesta directamente desde objetos ORM."""

    model_config = ConfigDict(from_attributes=True)


class RutaSalida(Salida):
    id: int
    origen_municipio: str
    destino_municipio: str
    distancia_km: int


class TipoCargaSalida(Salida):
    id: int
    nombre: str
    es_fragil: bool
    requiere_refrigeracion: bool
    es_peligrosa: bool


class TipoVehiculoSalida(Salida):
    id: int
    nombre: str
    peso_max_kg: float
    volumen_max_m3: float
    es_refrigerado: bool


class PuntajeSalida(Salida):
    """Puntajes base 0-100 tal como vienen del Excel."""

    puntaje_precio: float
    puntaje_tiempo: float
    puntaje_cumplimiento: float
    puntaje_seguridad: float
    n_servicios: int
    fortaleza: str | None
    debilidad: str | None
    fecha_calculo: date


class ProveedorSalida(Salida):
    id: int
    nombre: str
    experiencia_anios: int | None
    antiguedad_datacredito: int | None
    activo: bool
    puntaje: PuntajeSalida | None
