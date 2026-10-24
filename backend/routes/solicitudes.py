"""Solicitudes: simular recomendación, confirmar proveedor y consultar el historial."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from config.database import get_db
from config.settings import PUERTOS_ORIGEN
from models import (
    ESTADO_COMPLETADA,
    ESTADO_POR_APROBAR,
    ESTADOS,
    Proveedor,
    Ruta,
    Solicitud,
    TipoCarga,
    TipoVehiculo,
)
from schemas.solicitudes import (
    DescartadoSalida,
    MotivoSalida,
    PaginaSolicitudes,
    ProveedorRecomendado,
    Simulacion,
    SolicitudConfirmar,
    SolicitudCrear,
    SolicitudResumen,
    SolicitudSalida,
)
from services.scoring import (
    Calificado,
    Descartado,
    Motivo,
    Requerimiento,
    SinProveedoresCompatibles,
    pesos_desde_niveles,
    recomendar,
)

router = APIRouter(tags=["solicitudes"])
DECIMALES = 4


def _error(codigo_http: int, mensaje: str, codigo: str, datos: dict | None = None, **extra) -> HTTPException:
    """Error con mensaje en español y, para traducir en el frontend, un código y sus datos."""
    return HTTPException(codigo_http, {"mensaje": mensaje, "codigo": codigo, "datos": datos or {}, **extra})


def _exigir_existente(sesion: Session, modelo, id_: int, entidad: str) -> None:
    """404 si el id no existe (en vez de un error 500 por la llave foránea)."""
    if sesion.get(modelo, id_) is None:
        raise _error(status.HTTP_404_NOT_FOUND, f"{entidad} con id {id_} no existe",
                     "no_existe", {"entidad": modelo.__tablename__, "id": id_})


def _motivos_salida(motivos: list[Motivo]) -> list[MotivoSalida]:
    return [MotivoSalida(codigo=m.codigo, datos=m.datos) for m in motivos]


def _descartado_salida(d: Descartado) -> DescartadoSalida:
    return DescartadoSalida(proveedor_id=d.proveedor_id, nombre=d.nombre, motivo=d.motivo,
                            motivos=_motivos_salida(d.motivos))


def _evaluar(sesion: Session, datos: SolicitudCrear) -> tuple[dict[str, float], list[Calificado], list[Descartado]]:
    """Valida ids, calcula los pesos y aplica filtros y scoring (404 / 422 / 409 según el caso)."""
    _exigir_existente(sesion, Ruta, datos.ruta_id, "Ruta")
    ruta = sesion.get(Ruta, datos.ruta_id)
    if ruta.origen_municipio not in PUERTOS_ORIGEN:
        raise _error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"La ruta {ruta.origen_municipio} → {ruta.destino_municipio} no es operativa: "
            f"solo se aceptan rutas con origen en {' o '.join(PUERTOS_ORIGEN)}.",
            "ruta_no_operativa",
            {"origen": ruta.origen_municipio, "destino": ruta.destino_municipio, "puertos": list(PUERTOS_ORIGEN)},
        )
    _exigir_existente(sesion, TipoCarga, datos.tipo_carga_id, "Tipo de carga")
    _exigir_existente(sesion, TipoVehiculo, datos.tipo_vehiculo_id, "Tipo de vehículo")
    pesos = pesos_desde_niveles(datos.nivel_precio, datos.nivel_confiabilidad, datos.nivel_tiempo)
    requerimiento = Requerimiento(datos.ruta_id, datos.tipo_vehiculo_id, datos.tipo_carga_id,
                                  datos.peso_kg, datos.volumen_m3)
    try:
        ranking, descartados = recomendar(sesion, requerimiento, pesos)
    except SinProveedoresCompatibles as e:
        raise _error(
            status.HTTP_409_CONFLICT, e.mensaje, e.codigo, e.datos,
            problemas=[m.model_dump() for m in _motivos_salida(e.problemas)],
            descartados=[_descartado_salida(d).model_dump() for d in e.descartados],
        )
    return pesos, ranking, descartados


def _recomendado(posicion: int, c: Calificado) -> ProveedorRecomendado:
    return ProveedorRecomendado(
        posicion=posicion, proveedor_id=c.proveedor_id, nombre=c.nombre,
        precio_cop=c.precio_cop, tiempo_estimado_h=c.tiempo_estimado_h,
        vehiculos_disponibles=c.vehiculos_disponibles,
        calificacion_precio=round(c.calificacion_precio, 2),
        calificacion_confiabilidad=round(c.calificacion_confiabilidad, 2),
        calificacion_tiempo=round(c.calificacion_tiempo, 2),
        score_final=round(c.score_final, 2),
        puntaje_cumplimiento=round(c.puntaje_cumplimiento, 2),
        fortaleza=c.fortaleza, debilidad=c.debilidad,
    )


@router.post("/solicitudes/simular", response_model=Simulacion)
def simular_solicitud(datos: SolicitudCrear, sesion: Session = Depends(get_db)):
    """Calcula los pesos (%) y el ranking de proveedores. NO guarda nada en la base."""
    pesos, ranking, descartados = _evaluar(sesion, datos)
    sugeridos = [_recomendado(i, c) for i, c in enumerate(ranking, start=1)]
    return Simulacion(
        pesos={k: round(v, DECIMALES) for k, v in pesos.items()},
        recomendado=sugeridos[0],
        ranking=sugeridos,
        descartados=[_descartado_salida(d) for d in descartados],
    )


@router.post("/solicitudes", response_model=SolicitudSalida, status_code=status.HTTP_201_CREATED)
def confirmar_solicitud(datos: SolicitudConfirmar, sesion: Session = Depends(get_db)):
    """Guarda la solicitud con el proveedor elegido, en estado 'Por aprobar'.

    Se vuelve a evaluar: si el proveedor ya no es compatible (p. ej. se quedó sin
    vehículos disponibles desde la simulación) responde 409 y no guarda nada.
    """
    _exigir_existente(sesion, Proveedor, datos.proveedor_id, "Proveedor")
    pesos, ranking, descartados = _evaluar(sesion, datos)
    elegido = next((c for c in ranking if c.proveedor_id == datos.proveedor_id), None)
    if elegido is None:
        propio = next((d for d in descartados if d.proveedor_id == datos.proveedor_id), None)
        motivo = propio.motivo if propio else "no es compatible con la solicitud"
        problemas = [m.model_dump() for m in _motivos_salida(propio.motivos)] if propio else []
        raise _error(status.HTTP_409_CONFLICT, f"El proveedor elegido ya no es válido: {motivo}",
                     "proveedor_no_valido", {}, problemas=problemas, descartados=[])

    solicitud = Solicitud(
        **datos.model_dump(exclude={"proveedor_id"}),
        fecha_solicitud=date.today(),
        estado=ESTADO_POR_APROBAR,
        proveedor_asignado_id=elegido.proveedor_id,
        precio_cotizado_cop=elegido.precio_cop,
        tiempo_estimado_h=elegido.tiempo_estimado_h,
        peso_precio=pesos["precio"],
        peso_confiabilidad=pesos["confiabilidad"],
        peso_tiempo=pesos["tiempo"],
    )
    sesion.add(solicitud)
    sesion.commit()
    return solicitud


@router.get("/solicitudes", response_model=PaginaSolicitudes)
def listar_solicitudes(
    activas: bool = Query(False, description="true = excluye las 'Completada'"),
    estado: str | None = Query(None, description=f"Uno de: {', '.join(ESTADOS)}"),
    pagina: int = Query(1, ge=1, le=10_000),
    tamano: int = Query(20, ge=1, le=100),
    sesion: Session = Depends(get_db),
):
    """Solicitudes de la más reciente a la más antigua, con nombres legibles."""
    if estado is not None and estado not in ESTADOS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Estado inválido. Use uno de: {', '.join(ESTADOS)}")
    filtros = []
    if activas:
        filtros.append(Solicitud.estado != ESTADO_COMPLETADA)
    if estado is not None:
        filtros.append(Solicitud.estado == estado)

    total = sesion.scalar(select(func.count()).select_from(Solicitud).where(*filtros))
    vehiculo = aliased(TipoVehiculo)
    consulta = (
        select(Solicitud, Ruta, TipoCarga.nombre, vehiculo.nombre, Proveedor.nombre)
        .join(Ruta, Solicitud.ruta_id == Ruta.id)
        .join(TipoCarga, Solicitud.tipo_carga_id == TipoCarga.id)
        .outerjoin(vehiculo, Solicitud.tipo_vehiculo_id == vehiculo.id)
        .outerjoin(Proveedor, Solicitud.proveedor_asignado_id == Proveedor.id)
        .where(*filtros)
        .order_by(Solicitud.id.desc())
        .offset((pagina - 1) * tamano)
        .limit(tamano)
    )
    items = [
        SolicitudResumen(
            id=s.id, fecha_solicitud=s.fecha_solicitud, cliente_nombre=s.cliente_nombre,
            origen=r.origen_municipio, destino=r.destino_municipio, tipo_carga=carga,
            tipo_vehiculo=tipo_v, proveedor=prov, peso_kg=s.peso_kg,
            precio_cotizado_cop=s.precio_cotizado_cop, tiempo_estimado_h=s.tiempo_estimado_h,
            estado=s.estado,
        )
        for s, r, carga, tipo_v, prov in sesion.execute(consulta)
    ]
    return PaginaSolicitudes(items=items, total=total, pagina=pagina, tamano=tamano)


@router.get("/solicitudes/conteo", response_model=dict[str, int])
def contar_por_estado(sesion: Session = Depends(get_db)):
    """Cantidad de solicitudes por estado (incluye los estados en 0)."""
    conteo = dict(sesion.execute(select(Solicitud.estado, func.count()).group_by(Solicitud.estado)).all())
    return {e: conteo.get(e, 0) for e in ESTADOS}
