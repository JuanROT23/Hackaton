"""Modelos ORM. Importarlos aquí registra las 9 tablas en Base.metadata."""
from models.proveedor import Proveedor
from models.puntaje_proveedor import PuntajeProveedor
from models.ruta import Ruta
from models.servicio_historico import ServicioHistorico
from models.solicitud import (
    ESTADO_COMPLETADA,
    ESTADO_INICIAL,
    ESTADO_POR_APROBAR,
    ESTADOS,
    Solicitud,
)
from models.tarifa import Tarifa
from models.tipo_carga import TipoCarga
from models.tipo_vehiculo import TipoVehiculo
from models.vehiculo import Vehiculo

__all__ = [
    "Proveedor", "PuntajeProveedor", "Ruta", "ServicioHistorico", "Solicitud", "Tarifa",
    "TipoCarga", "TipoVehiculo", "Vehiculo", "ESTADO_COMPLETADA", "ESTADO_INICIAL",
    "ESTADO_POR_APROBAR", "ESTADOS",
]
