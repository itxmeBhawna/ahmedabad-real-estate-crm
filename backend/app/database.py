"""
database.py — SQLAlchemy engine & session factory.

Reads DB_ENGINE from the environment (via .env) and builds the correct
connection URL automatically.  Defaults to SQLite for instant local testing.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ── Load .env if present ────────────────────────────────────────────────────
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)


# ── Build connection URL ─────────────────────────────────────────────────────
def _build_database_url() -> str:
    engine_type = os.getenv("DB_ENGINE", "sqlite").lower()

    if engine_type == "mysql":
        host     = os.getenv("DB_HOST", "localhost")
        port     = os.getenv("DB_PORT", "3306")
        user     = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "")
        db_name  = os.getenv("DB_NAME", "ahmedabad_re_crm")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"

    # SQLite fallback
    sqlite_path = os.getenv("SQLITE_PATH", "./ahmedabad_re_crm.db")
    abs_path = (Path(__file__).resolve().parent.parent / sqlite_path).resolve()
    return f"sqlite:///{abs_path}"


DATABASE_URL = _build_database_url()

# ── Engine & Session ─────────────────────────────────────────────────────────
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,          # Set True to log all SQL statements
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# ── Declarative Base ─────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────
def get_db():
    """FastAPI / dependency-injection compatible session generator."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all ORM-mapped tables in the target database."""
    # Import models so their metadata is registered before create_all()
    from app.models import user, project, lead, fact_sheet, site_visit  # noqa: F401

    Base.metadata.create_all(bind=engine)
    print(f"[DB] Tables created  →  {DATABASE_URL}")


def verify_connection() -> None:
    """Quick connectivity probe — raises on failure."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"[DB] Connection OK   →  {DATABASE_URL}")


if __name__ == "__main__":
    verify_connection()
    create_all_tables()

