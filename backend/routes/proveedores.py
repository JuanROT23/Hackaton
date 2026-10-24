"""Proveedores con su puntaje base."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from config.database import get_db
from models import Proveedor
from schemas.catalogos import ProveedorSalida

router = APIRouter(tags=["proveedores"])


@router.get("/proveedores", response_model=list[ProveedorSalida])
def listar_proveedores(sesion: Session = Depends(get_db)):
    """Proveedores con sus puntajes base 0-100, fortaleza y debilidad."""
    consulta = select(Proveedor).options(selectinload(Proveedor.puntaje)).order_by(Proveedor.id)
    return sesion.scalars(consulta).all()
