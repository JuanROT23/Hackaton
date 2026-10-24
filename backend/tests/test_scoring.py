"""Pruebas de las calificaciones y filtros de carga (sin base de datos)."""
import pytest

from models import Proveedor, PuntajeProveedor, Ruta, Tarifa, TipoCarga, TipoVehiculo
from services.scoring import (
    calificacion_confiabilidad,
    calificacion_precio,
    calificacion_tiempo,
    motivos_descarte,
    pesos_desde_niveles,
    problemas_de_carga,
    score_final,
)

VAN = TipoVehiculo(nombre="Van", peso_max_kg=1500, volumen_max_m3=12, es_refrigerado=True)
NHR = TipoVehiculo(nombre="NHR", peso_max_kg=4500, volumen_max_m3=20, es_refrigerado=False)
GENERAL = TipoCarga(nombre="Carga General", es_fragil=False, requiere_refrigeracion=False, es_peligrosa=False)
PERECEDEROS = TipoCarga(nombre="Alimentos Perecederos", es_fragil=False, requiere_refrigeracion=True, es_peligrosa=False)
PELIGROSA = TipoCarga(nombre="Mercancía Peligrosa", es_fragil=False, requiere_refrigeracion=False, es_peligrosa=True)


def test_pesos_desde_niveles():
    pesos = pesos_desde_niveles("Alta", "Media", "Baja")  # 3, 2, 1 -> suma 6
    assert pesos == pytest.approx({"precio": 3 / 6, "confiabilidad": 2 / 6, "tiempo": 1 / 6})
    assert sum(pesos.values()) == pytest.approx(1.0)


def test_niveles_iguales_dan_tercios():
    for nivel in ("Baja", "Media", "Alta"):
        assert all(w == pytest.approx(1 / 3) for w in pesos_desde_niveles(nivel, nivel, nivel).values())


def test_calificacion_precio():
    assert calificacion_precio(1_000_000, 1_000_000) == 100
    assert calificacion_precio(2_000_000, 1_000_000) == 50


def test_calificacion_confiabilidad_y_tiempo():
    assert calificacion_confiabilidad(90, 0.02) == pytest.approx((90 + 98) / 2)
    assert calificacion_confiabilidad(90, None) == 90
    assert calificacion_tiempo(92, 88) == 90


def test_score_final():
    pesos = {"precio": 0.5, "confiabilidad": 0.3, "tiempo": 0.2}
    assert score_final(pesos, 100, 80, 50) == pytest.approx(50 + 24 + 10)


def test_carga_dentro_de_capacidad():
    assert problemas_de_carga(NHR, GENERAL, 4000, 18) == []


def test_exceso_de_peso_y_volumen():
    problemas = problemas_de_carga(VAN, GENERAL, 2000, 15)
    assert [p.codigo for p in problemas] == ["peso_excedido", "volumen_excedido"]
    assert "1.500 kg" in problemas[0].texto
    assert problemas[0].datos == {"peso": 2000, "tipo": "Van", "maximo": 1500}


def test_refrigeracion():
    assert problemas_de_carga(VAN, PERECEDEROS, 1000, 5) == []
    problema = problemas_de_carga(NHR, PERECEDEROS, 1000, 5)[0]
    assert problema.codigo == "requiere_refrigeracion" and "refrigeración" in problema.texto


def test_carga_peligrosa_sin_certificacion():
    problema = problemas_de_carga(NHR, PELIGROSA, 1000, 5)[0]
    assert problema.codigo == "carga_peligrosa" and problema.datos == {"carga": "Mercancía Peligrosa"}


# ------------------------------------------------- motivos de descarte individuales
NHR.id, VAN.id = 2, 1
RUTA = Ruta(id=1, origen_municipio="Buenaventura", destino_municipio="Bogotá", distancia_km=500)
NOMBRES = {1: "Van", 2: "NHR"}
ACTIVO = Proveedor(id=1, nombre="P", activo=True)
PUNTAJE = PuntajeProveedor(proveedor_id=1)


def _motivos(tarifas, flota, proveedor=ACTIVO, puntaje=PUNTAJE):
    return motivos_descarte(proveedor, tarifas, flota, puntaje, NHR, RUTA, NOMBRES)


def _textos(tarifas, flota, **kw):
    return [m.texto for m in _motivos(tarifas, flota, **kw)]


def test_proveedor_que_cumple_todo_no_tiene_motivos():
    assert _motivos({2: Tarifa()}, (2, 3)) == []


def test_sin_cobertura_de_la_ruta():
    (motivo,) = _motivos({}, (2, 3))
    assert motivo.texto == "Sin cobertura registrada para Buenaventura → Bogotá"
    assert motivo.codigo == "sin_cobertura" and motivo.datos == {"origen": "Buenaventura", "destino": "Bogotá"}


def test_cubre_la_ruta_con_otro_vehiculo():
    (motivo,) = _motivos({1: Tarifa()}, (2, 3))
    assert motivo.texto == "Cubre la ruta, pero no con NHR (ofrece: Van)"
    assert motivo.codigo == "otro_vehiculo" and motivo.datos == {"tipo": "NHR", "ofrece": ["Van"]}


def test_flota_ocupada_o_inexistente():
    assert _textos({2: Tarifa()}, (0, 3)) == ["Sin vehículos tipo NHR disponibles (3 en flota, todos ocupados)"]
    assert _textos({2: Tarifa()}, (0, 0)) == ["No tiene vehículos tipo NHR en su flota"]


def test_reune_todos_los_motivos():
    inactivo = Proveedor(id=2, nombre="Q", activo=False)
    motivos = _motivos({}, (0, 0), proveedor=inactivo, puntaje=None)
    assert [m.codigo for m in motivos] == ["inactivo", "sin_cobertura", "sin_flota", "sin_puntaje"]
