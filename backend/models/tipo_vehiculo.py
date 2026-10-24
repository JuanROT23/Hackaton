"""Tabla tipo_vehiculo: tipos de vehículo y su capacidad."""
from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class TipoVehiculo(Base):
    __tablename__ = "tipo_vehiculo"
    __table_args__ = (
        CheckConstraint("peso_max_kg > 0", name="ck_tipo_vehiculo_peso"),
        CheckConstraint("volumen_max_m3 > 0", name="ck_tipo_vehiculo_volumen"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
    peso_max_kg: Mapped[float]
    volumen_max_m3: Mapped[float]
    es_refrigerado: Mapped[bool] = mapped_column(default=False)
