"""Configuración leída de variables de entorno (.env), con valores por defecto."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Carpeta backend/ y raíz del proyecto, para no depender de desde dónde se ejecute
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROYECTO_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

# "or" en vez de un valor por defecto de getenv: una variable vacía en el .env también usa el defecto
DATABASE_URL: str = (
    os.getenv("DATABASE_URL") or f"sqlite:///{(BACKEND_DIR / 'cosco_shipping.db').as_posix()}"
)
EXCEL_PATH: Path = Path(
    os.getenv("EXCEL_PATH") or PROYECTO_DIR / "COSCO_Colombia_Relacional_SINTETICA_2024_2026.xlsx"
)
# Único origen autorizado por CORS (el del frontend)
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN") or "http://localhost:5173"

# Puertos de salida operativos de COSCO: solo se ofrecen y aceptan rutas que PARTEN de aquí
PUERTOS_ORIGEN: tuple[str, ...] = ("Buenaventura", "Cartagena")
