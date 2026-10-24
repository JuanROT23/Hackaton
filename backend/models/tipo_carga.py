"""Tabla tipo_carga: tipos de mercancía y sus requisitos."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class TipoCarga(Base):
    __tablename__ = "tipo_carga"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    es_fragil: Mapped[bool] = mapped_column(default=False)
    requiere_refrigeracion: Mapped[bool] = mapped_column(default=False)
    es_peligrosa: Mapped[bool] = mapped_column(default=False)
