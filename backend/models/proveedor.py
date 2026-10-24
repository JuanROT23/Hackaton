"""Tabla proveedor: empresas de transporte terrestre."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base


class Proveedor(Base):
    __tablename__ = "proveedor"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True)
    experiencia_anios: Mapped[int | None]
    antiguedad_datacredito: Mapped[int | None]
    activo: Mapped[bool] = mapped_column(default=True)

    puntaje: Mapped["PuntajeProveedor | None"] = relationship(back_populates="proveedor")
