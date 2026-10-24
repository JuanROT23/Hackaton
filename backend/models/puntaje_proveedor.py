"""Tabla puntaje_proveedor: puntajes base 0-100 (una fila por proveedor)."""
from datetime import date

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base

COLUMNAS_PUNTAJE = ("puntaje_precio", "puntaje_tiempo", "puntaje_cumplimiento", "puntaje_seguridad")


class PuntajeProveedor(Base):
    __tablename__ = "puntaje_proveedor"
    __table_args__ = tuple(
        CheckConstraint(f"{c} BETWEEN 0 AND 100", name=f"ck_{c}") for c in COLUMNAS_PUNTAJE
    )

    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedor.id"), primary_key=True)
    puntaje_precio: Mapped[float]
    puntaje_tiempo: Mapped[float]
    puntaje_cumplimiento: Mapped[float]
    puntaje_seguridad: Mapped[float]
    n_servicios: Mapped[int]
    fortaleza: Mapped[str | None] = mapped_column(String(200))
    debilidad: Mapped[str | None] = mapped_column(String(200))
    fecha_calculo: Mapped[date]

    proveedor: Mapped["Proveedor"] = relationship(back_populates="puntaje")
