"""Aplicación FastAPI del backend COSCO SHIPPING.

Uso (desde la carpeta backend/):  uvicorn main:app --reload
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import catalogos, proveedores, solicitudes

PREFIJO = "/api/v1"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cosco")

app = FastAPI(
    title="COSCO SHIPPING · Proveedores terrestres",
    description="Infraestructura base: catálogos, proveedores y registro de solicitudes.",
    version="0.1.0",
)

# Demo: se aceptan todos los orígenes (Netlify, localhost, etc.).
# Antes de un uso real, restringir allow_origins al dominio del frontend (FRONTEND_ORIGIN).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for modulo in (catalogos, proveedores, solicitudes):
    app.include_router(modulo.router, prefix=PREFIJO)


@app.exception_handler(Exception)
def error_inesperado(request: Request, exc: Exception) -> JSONResponse:
    """Mensaje genérico al cliente; el detalle queda solo en el log del servidor."""
    logger.exception("Error no controlado en %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse({"detail": "Error interno del servidor"}, status_code=500)


@app.get("/health", tags=["sistema"])
def health() -> dict[str, str]:
    """Comprueba que la API está viva."""
    return {"estado": "ok"}
