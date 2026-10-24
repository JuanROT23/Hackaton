"""Carga el Excel sintético en SQLite.

Uso (desde la carpeta backend/):  python -m scripts.seed

Cada ejecución BORRA y vuelve a crear las tablas, así que puede correrse
varias veces sin duplicar datos. Se conservan los ids del Excel para que
las llaves foráneas apunten a las mismas filas.
"""
import math
from datetime import date
from pathlib import Path

import pandas as pd
from sqlalchemy import Engine, func, insert, select, text
from sqlalchemy.orm import Session

import models  # noqa: F401  (registra las tablas en Base.metadata)
from config.database import Base, engine
from config.settings import EXCEL_PATH
from models import (
    Proveedor,
    PuntajeProveedor,
    Ruta,
    ServicioHistorico,
    Solicitud,
    Tarifa,
    TipoCarga,
    TipoVehiculo,
    Vehiculo,
)

# Hoja del Excel -> modelo, en orden de dependencias (primero las tablas sin llaves foráneas)
HOJAS = [
    ("Tipo_Vehiculo", TipoVehiculo),
    ("Tipo_Carga", TipoCarga),
    ("Ruta", Ruta),
    ("Proveedores", Proveedor),
    ("Puntaje_Proveedor", PuntajeProveedor),
    ("Vehiculo", Vehiculo),
    ("Tarifa", Tarifa),
    ("Solicitud", Solicitud),
    ("Servicio_Historico", ServicioHistorico),
]


# Columnas del Excel que el modelo ya no usa y se descartan a propósito al leer
COLUMNAS_DESCARTADAS = {
    "Solicitud": ["urgencia"],  # eliminada: la rapidez ya se pondera con nivel_tiempo
}


class ErrorDeCarga(Exception):
    """El Excel no tiene la forma esperada."""


def leer_excel(ruta: Path) -> dict[str, pd.DataFrame]:
    """Lee solo las 9 hojas que se cargan (Municipios y las de resumen se ignoran)."""
    if not ruta.exists():
        raise ErrorDeCarga(f"No se encontró el Excel: {ruta.name}")
    hojas = pd.read_excel(ruta, sheet_name=[hoja for hoja, _ in HOJAS])
    for hoja, columnas in COLUMNAS_DESCARTADAS.items():
        hojas[hoja] = hojas[hoja].drop(columns=columnas, errors="ignore")
    return hojas


def valores_por_defecto(modelo) -> dict:
    """Columnas del modelo que tienen valor por defecto fijo: {columna: valor}."""
    return {
        c.key: c.default.arg
        for c in modelo.__table__.columns
        if c.default is not None and c.default.is_scalar
    }


def columnas_opcionales(modelo) -> dict:
    """Columnas que el Excel puede no traer: {columna: valor por defecto o None si admite nulos}."""
    opcionales = {c.key: None for c in modelo.__table__.columns if c.nullable and not c.primary_key}
    return opcionales | valores_por_defecto(modelo)


def validar_columnas(df: pd.DataFrame, modelo, hoja: str) -> None:
    """Las columnas de la hoja deben coincidir con las del modelo.

    Solo pueden faltar columnas con valor por defecto o que admitan nulos
    (p. ej. las preferencias y los niveles de importancia, que el Excel no trae).
    """
    esperadas = set(modelo.__table__.columns.keys())
    encontradas = set(df.columns)
    faltan = esperadas - encontradas - set(columnas_opcionales(modelo))
    sobran = encontradas - esperadas
    if faltan or sobran:
        raise ErrorDeCarga(f"Hoja '{hoja}': faltan {sorted(faltan)}, sobran {sorted(sobran)}")


def convertir_valor(valor, tipo: type, hoja: str, columna: str):
    """Convierte un valor de pandas al tipo de Python de la columna (NaN -> None)."""
    if valor is None or (not isinstance(valor, str) and pd.isna(valor)):
        return None
    if tipo is date:
        return pd.Timestamp(valor).date()
    if tipo is bool:
        return bool(valor)
    if tipo is int:
        # Las columnas con nulos llegan como float (12.0); se rechaza si tiene decimales
        if isinstance(valor, float) and not valor.is_integer():
            raise ErrorDeCarga(f"Hoja '{hoja}', columna '{columna}': {valor} no es entero")
        return int(valor)
    if tipo is float:
        if math.isinf(float(valor)):
            raise ErrorDeCarga(f"Hoja '{hoja}', columna '{columna}': valor infinito")
        return float(valor)
    return str(valor).strip()


def a_registros(df: pd.DataFrame, modelo, hoja: str) -> list[dict]:
    """Filas de la hoja como diccionarios listos para insertar.

    Las columnas que el Excel no trae se llenan con su valor por defecto (o NULL).
    """
    tipos = {c.key: c.type.python_type for c in modelo.__table__.columns if c.key in df.columns}
    defectos = {col: valor for col, valor in columnas_opcionales(modelo).items() if col not in df.columns}
    return [
        {col: convertir_valor(fila[col], tipo, hoja, col) for col, tipo in tipos.items()} | defectos
        for fila in df.to_dict("records")
    ]


def cargar(motor: Engine, hojas: dict[str, pd.DataFrame]) -> dict[str, int]:
    """Recrea las tablas e inserta todas las hojas en UNA transacción."""
    registros = {}
    for hoja, modelo in HOJAS:
        validar_columnas(hojas[hoja], modelo, hoja)
        registros[hoja] = a_registros(hojas[hoja], modelo, hoja)

    Base.metadata.drop_all(motor)
    Base.metadata.create_all(motor)
    with Session(motor) as sesion, sesion.begin():
        for hoja, modelo in HOJAS:
            if registros[hoja]:
                sesion.execute(insert(modelo), registros[hoja])
    return {hoja: len(filas) for hoja, filas in registros.items()}


def verificar(motor: Engine, esperados: dict[str, int]) -> None:
    """Comprueba conteos por tabla e integridad de llaves foráneas."""
    with Session(motor) as sesion:
        for hoja, modelo in HOJAS:
            en_bd = sesion.scalar(select(func.count()).select_from(modelo))
            if en_bd != esperados[hoja]:
                raise ErrorDeCarga(f"{modelo.__tablename__}: {en_bd} filas en BD, {esperados[hoja]} en Excel")
        huerfanos = sesion.execute(text("PRAGMA foreign_key_check")).all()
        if huerfanos:
            raise ErrorDeCarga(f"Llaves foráneas rotas: {huerfanos[:5]}")


def main() -> None:
    """Lee el Excel, carga la base y muestra un resumen."""
    print(f"Leyendo {EXCEL_PATH.name} ...")
    conteos = cargar(engine, leer_excel(EXCEL_PATH))
    verificar(engine, conteos)
    print("Carga completa. Filas por tabla:")
    for hoja, modelo in HOJAS:
        print(f"  {modelo.__tablename__:<20} {conteos[hoja]:>6}")
    print("Integridad de llaves foráneas: OK")


if __name__ == "__main__":
    main()
