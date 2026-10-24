"""Tabla ruta: trayectos entre municipios (como texto; no hay tabla municipio)."""
from sqlalchemy import CheckConstraint, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class Ruta(Base):
    __tablename__ = "ruta"
    __table_args__ = (
        UniqueConstraint("origen_municipio", "destino_municipio", name="uq_ruta_origen_destino"),
        CheckConstraint("distancia_km > 0", name="ck_ruta_distancia"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    origen_municipio: Mapped[str] = mapped_column(String(60))
    destino_municipio: Mapped[str] = mapped_column(String(60))
    distancia_km: Mapped[int]
