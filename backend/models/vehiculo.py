"""Tabla vehiculo: flota de cada proveedor (disponibilidad simulada)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculo"

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedor.id"), index=True)
    tipo_vehiculo_id: Mapped[int] = mapped_column(ForeignKey("tipo_vehiculo.id"))
    placa: Mapped[str] = mapped_column(String(15), unique=True)
    disponible: Mapped[bool] = mapped_column(default=True)
