"""Catálogos para los desplegables del frontend."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.database import get_db
from config.settings import PUERTOS_ORIGEN
from models import Ruta, TipoCarga, TipoVehiculo
from schemas.catalogos import RutaSalida, TipoCargaSalida, TipoVehiculoSalida

router = APIRouter(tags=["catálogos"])


@router.get("/rutas", response_model=list[RutaSalida])
def listar_rutas(sesion: Session = Depends(get_db)):
    """Rutas operativas: solo las que PARTEN de un puerto COSCO (Buenaventura, Cartagena)."""
    consulta = (
        select(Ruta)
        .where(Ruta.origen_municipio.in_(PUERTOS_ORIGEN))
        .order_by(Ruta.origen_municipio, Ruta.destino_municipio)
    )
    return sesion.scalars(consulta).all()


@router.get("/tipos-carga", response_model=list[TipoCargaSalida])
def listar_tipos_carga(sesion: Session = Depends(get_db)):
    """Tipos de carga."""
    return sesion.scalars(select(TipoCarga).order_by(TipoCarga.id)).all()


@router.get("/tipos-vehiculo", response_model=list[TipoVehiculoSalida])
def listar_tipos_vehiculo(sesion: Session = Depends(get_db)):
    """Tipos de vehículo con su capacidad."""
    return sesion.scalars(select(TipoVehiculo).order_by(TipoVehiculo.id)).all()
