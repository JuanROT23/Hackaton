"""Tabla servicio_historico: servicios ya realizados (fuente de los puntajes)."""
from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class ServicioHistorico(Base):
    __tablename__ = "servicio_historico"

    id: Mapped[int] = mapped_column(primary_key=True)
    solicitud_id: Mapped[int] = mapped_column(ForeignKey("solicitud.id"), unique=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedor.id"), index=True)
    ruta_id: Mapped[int] = mapped_column(ForeignKey("ruta.id"), index=True)
    tipo_carga_id: Mapped[int] = mapped_column(ForeignKey("tipo_carga.id"))
    fecha: Mapped[date]
    peso_kg: Mapped[float]
    precio_cobrado_cop: Mapped[int]
    tiempo_prometido_h: Mapped[int]
    tiempo_real_h: Mapped[int]
    a_tiempo: Mapped[bool]
    incidente: Mapped[bool]
