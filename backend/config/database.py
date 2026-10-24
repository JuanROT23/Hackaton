"""Conexión SQLAlchemy a SQLite y sesión por petición."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config.settings import DATABASE_URL


class Base(DeclarativeBase):
    """Clase base de todos los modelos ORM."""


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _activar_claves_foraneas(conexion_dbapi, _registro) -> None:
    """SQLite ignora las llaves foráneas si no se activan en cada conexión."""
    cursor = conexion_dbapi.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: abre una sesión por petición y la cierra al terminar."""
    sesion = SessionLocal()
    try:
        yield sesion
    finally:
        sesion.close()
