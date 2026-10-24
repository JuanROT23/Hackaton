"""Tabla tarifa: precio fijo de un proveedor para una ruta y un tipo de vehículo."""
from sqlalchemy import CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class Tarifa(Base):
    __tablename__ = "tarifa"
    __table_args__ = (
        UniqueConstraint("proveedor_id", "ruta_id", "tipo_vehiculo_id", name="uq_tarifa"),
        CheckConstraint("precio_cop > 0", name="ck_tarifa_precio"),
        CheckConstraint("tiempo_estimado_h > 0", name="ck_tarifa_tiempo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedor.id"))
    ruta_id: Mapped[int] = mapped_column(ForeignKey("ruta.id"), index=True)
    tipo_vehiculo_id: Mapped[int] = mapped_column(ForeignKey("tipo_vehiculo.id"))
    # Pesos colombianos enteros (el Excel no maneja centavos)
    precio_cop: Mapped[int]
    tiempo_estimado_h: Mapped[int]
