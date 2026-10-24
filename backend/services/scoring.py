"""Filtros duros y motor de scoring de proveedores para una solicitud."""
from dataclasses import dataclass

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from models import (
    Proveedor,
    PuntajeProveedor,
    Ruta,
    ServicioHistorico,
    Tarifa,
    TipoCarga,
    TipoVehiculo,
    Vehiculo,
)


@dataclass
class Requerimiento:
    """Lo que pide la solicitud."""

    ruta_id: int
    tipo_vehiculo_id: int
    tipo_carga_id: int
    peso_kg: float
    volumen_m3: float


@dataclass
class Descartado:
    """Proveedor que no pasa un filtro duro."""

    proveedor_id: int
    nombre: str
    motivo: str


@dataclass
class Calificado:
    """Proveedor compatible con sus calificaciones 0-100 y su puntaje final."""

    proveedor_id: int
    nombre: str
    precio_cop: int
    tiempo_estimado_h: int
    vehiculos_disponibles: int
    calificacion_precio: float
    calificacion_confiabilidad: float
    calificacion_tiempo: float
    score_final: float
    puntaje_cumplimiento: float
    fortaleza: str | None
    debilidad: str | None


# Valor numérico de cada nivel de importancia
VALOR_NIVEL = {"Baja": 1, "Media": 2, "Alta": 3}


def pesos_desde_niveles(nivel_precio: str, nivel_confiabilidad: str, nivel_tiempo: str) -> dict[str, float]:
    """Convierte los 3 niveles en pesos que suman 1: w = valor / suma de los 3 valores.

    Ej.: precio Alta (3), confiabilidad Media (2), tiempo Baja (1) -> 3/6, 2/6, 1/6.
    """
    valores = {
        "precio": VALOR_NIVEL[nivel_precio],
        "confiabilidad": VALOR_NIVEL[nivel_confiabilidad],
        "tiempo": VALOR_NIVEL[nivel_tiempo],
    }
    total = sum(valores.values())
    return {factor: valor / total for factor, valor in valores.items()}


class SinProveedoresCompatibles(Exception):
    """Ningún proveedor puede atender la solicitud; incluye los motivos."""

    def __init__(self, mensaje: str, descartados: list[Descartado]):
        self.mensaje = mensaje
        self.descartados = descartados
        super().__init__(mensaje)


# ---------------------------------------------------------------- filtros duros

def _num(valor: float, decimales: int = 0) -> str:
    """Número con punto de miles y coma decimal: 1500.5 -> '1.500,5'."""
    return f"{valor:,.{decimales}f}".replace(",", "_").replace(".", ",").replace("_", ".")


def problemas_de_carga(tipo: TipoVehiculo, carga: TipoCarga, peso_kg: float, volumen_m3: float) -> list[str]:
    """Filtros que dependen solo de la solicitud: si fallan, ningún proveedor sirve."""
    problemas = []
    if peso_kg > tipo.peso_max_kg:
        problemas.append(f"el peso ({_num(peso_kg)} kg) supera la capacidad de {tipo.nombre} "
                         f"({_num(tipo.peso_max_kg)} kg)")
    if volumen_m3 > tipo.volumen_max_m3:
        problemas.append(f"el volumen ({_num(volumen_m3, 2)} m³) supera la capacidad de {tipo.nombre} "
                         f"({_num(tipo.volumen_max_m3)} m³)")
    if carga.requiere_refrigeracion and not tipo.es_refrigerado:
        problemas.append(f"{carga.nombre} requiere refrigeración y {tipo.nombre} no es refrigerado")
    if carga.es_peligrosa:
        problemas.append(f"{carga.nombre}: ningún proveedor tiene certificación para carga peligrosa registrada")
    return problemas


def _flota(sesion: Session, tipo_vehiculo_id: int) -> dict[int, tuple[int, int]]:
    """{proveedor_id: (vehículos disponibles, vehículos en flota)} de ese tipo."""
    consulta = (
        select(Vehiculo.proveedor_id, func.sum(case((Vehiculo.disponible, 1), else_=0)), func.count())
        .where(Vehiculo.tipo_vehiculo_id == tipo_vehiculo_id)
        .group_by(Vehiculo.proveedor_id)
    )
    return {p: (int(disponibles), total) for p, disponibles, total in sesion.execute(consulta)}


def _tarifas_ruta(sesion: Session, ruta_id: int) -> dict[int, dict[int, Tarifa]]:
    """{proveedor_id: {tipo_vehiculo_id: tarifa}} con TODAS las tarifas de la ruta."""
    tarifas: dict[int, dict[int, Tarifa]] = {}
    for t in sesion.scalars(select(Tarifa).where(Tarifa.ruta_id == ruta_id)):
        tarifas.setdefault(t.proveedor_id, {})[t.tipo_vehiculo_id] = t
    return tarifas


def motivos_descarte(proveedor: Proveedor, tarifas_ruta: dict[int, Tarifa], flota: tuple[int, int],
                     puntaje: PuntajeProveedor | None, tipo: TipoVehiculo, ruta: Ruta,
                     nombres_tipo: dict[int, str]) -> list[str]:
    """TODOS los filtros duros que no cumple este proveedor, con su detalle (lista vacía = pasa).

    `tarifas_ruta` son las tarifas del proveedor en la ruta, por tipo de vehículo;
    `flota` es (disponibles, total) del tipo de vehículo pedido.
    """
    motivos = []
    if not proveedor.activo:
        motivos.append("Proveedor inactivo")
    if not tarifas_ruta:
        motivos.append(f"Sin cobertura registrada para {ruta.origen_municipio} → {ruta.destino_municipio}")
    elif tipo.id not in tarifas_ruta:
        ofrece = ", ".join(sorted(nombres_tipo[t] for t in tarifas_ruta))
        motivos.append(f"Cubre la ruta, pero no con {tipo.nombre} (ofrece: {ofrece})")
    disponibles, total = flota
    if total == 0:
        motivos.append(f"No tiene vehículos tipo {tipo.nombre} en su flota")
    elif disponibles == 0:
        motivos.append(f"Sin vehículos tipo {tipo.nombre} disponibles ({total} en flota, todos ocupados)")
    if puntaje is None:
        motivos.append("Sin puntaje histórico calculado")
    return motivos


# ---------------------------------------------------------------- calificaciones

def _tasa_incidentes(sesion: Session) -> dict[int, float]:
    """{proveedor_id: proporción de servicios históricos con incidente}."""
    consulta = select(
        ServicioHistorico.proveedor_id,
        func.sum(case((ServicioHistorico.incidente, 1), else_=0)),
        func.count(),
    ).group_by(ServicioHistorico.proveedor_id)
    return {p: incidentes / total for p, incidentes, total in sesion.execute(consulta) if total}


def calificacion_precio(precio: int, precio_minimo: int) -> float:
    """100 para la tarifa más baja; los demás en proporción (el doble de caro = 50)."""
    return 100.0 * precio_minimo / precio


def calificacion_confiabilidad(puntaje_seguridad: float, tasa_incidentes: float | None) -> float:
    """Promedio del puntaje de seguridad y del % de servicios sin incidentes."""
    if tasa_incidentes is None:
        return puntaje_seguridad
    return (puntaje_seguridad + 100.0 * (1 - tasa_incidentes)) / 2


def calificacion_tiempo(puntaje_cumplimiento: float, puntaje_tiempo: float) -> float:
    """Promedio del cumplimiento (entregas a tiempo) y del puntaje de tiempo."""
    return (puntaje_cumplimiento + puntaje_tiempo) / 2


def score_final(pesos: dict[str, float], p: float, c: float, t: float) -> float:
    """S = w_precio·P + w_confiabilidad·C + w_tiempo·T."""
    return pesos["precio"] * p + pesos["confiabilidad"] * c + pesos["tiempo"] * t


# ---------------------------------------------------------------- orquestación

def recomendar(sesion: Session, req: Requerimiento, pesos: dict[str, float]) -> tuple[list[Calificado], list[Descartado]]:
    """Aplica filtros duros y devuelve (ranking ordenado por score, descartados).

    Lanza SinProveedoresCompatibles si nadie pasa los filtros.
    """
    tipo = sesion.get(TipoVehiculo, req.tipo_vehiculo_id)
    carga = sesion.get(TipoCarga, req.tipo_carga_id)
    problemas = problemas_de_carga(tipo, carga, req.peso_kg, req.volumen_m3)
    if problemas:
        raise SinProveedoresCompatibles(
            "Capacidad no disponible: " + "; ".join(problemas) + ". Revise el tipo de vehículo o de carga.", []
        )

    ruta = sesion.get(Ruta, req.ruta_id)
    tarifas_ruta = _tarifas_ruta(sesion, req.ruta_id)
    flota = _flota(sesion, req.tipo_vehiculo_id)
    puntajes = {p.proveedor_id: p for p in sesion.scalars(select(PuntajeProveedor))}
    nombres_tipo = dict(sesion.execute(select(TipoVehiculo.id, TipoVehiculo.nombre)).all())

    compatibles, descartados = [], []
    for proveedor in sesion.scalars(select(Proveedor).order_by(Proveedor.id)):
        motivos = motivos_descarte(proveedor, tarifas_ruta.get(proveedor.id, {}), flota.get(proveedor.id, (0, 0)),
                                   puntajes.get(proveedor.id), tipo, ruta, nombres_tipo)
        if motivos:
            descartados.append(Descartado(proveedor.id, proveedor.nombre, " · ".join(motivos)))
        else:
            compatibles.append(proveedor)
    # Para la tarifa y los vehículos libres de los que sí pasan
    tarifas = {p.id: tarifas_ruta[p.id][tipo.id] for p in compatibles}
    disponibles = {p.id: flota[p.id][0] for p in compatibles}

    if not compatibles:
        raise SinProveedoresCompatibles(
            f"Cobertura no disponible: ningún proveedor activo tiene tarifa y vehículos {tipo.nombre} "
            "disponibles para esta ruta.", descartados
        )

    incidentes = _tasa_incidentes(sesion)
    precio_minimo = min(tarifas[p.id].precio_cop for p in compatibles)
    ranking = []
    for proveedor in compatibles:
        tarifa, puntaje = tarifas[proveedor.id], puntajes[proveedor.id]
        p = calificacion_precio(tarifa.precio_cop, precio_minimo)
        c = calificacion_confiabilidad(puntaje.puntaje_seguridad, incidentes.get(proveedor.id))
        t = calificacion_tiempo(puntaje.puntaje_cumplimiento, puntaje.puntaje_tiempo)
        ranking.append(Calificado(
            proveedor_id=proveedor.id, nombre=proveedor.nombre,
            precio_cop=tarifa.precio_cop, tiempo_estimado_h=tarifa.tiempo_estimado_h,
            vehiculos_disponibles=disponibles[proveedor.id],
            calificacion_precio=p, calificacion_confiabilidad=c, calificacion_tiempo=t,
            score_final=score_final(pesos, p, c, t),
            puntaje_cumplimiento=puntaje.puntaje_cumplimiento,
            fortaleza=puntaje.fortaleza, debilidad=puntaje.debilidad,
        ))
    # Mayor score primero; en empate, el más barato
    ranking.sort(key=lambda x: (-x.score_final, x.precio_cop))
    return ranking, descartados
