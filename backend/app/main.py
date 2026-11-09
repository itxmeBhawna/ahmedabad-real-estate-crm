"""
main.py — FastAPI application entry point.

Start dev server:
    cd backend
    .venv\\Scripts\\uvicorn app.main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
ReDoc:       http://localhost:8000/redoc
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import create_all_tables
from app.routers import analytics, auth, chat, fact_sheets, leads, projects, visits


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on every cold start (idempotent DDL)
    create_all_tables()
    yield
    # Add any graceful-shutdown logic here (close connections, flush caches, etc.)


# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.APP_VERSION,
    description = (
        "End-to-end Real Estate Lead Management & AI Visit Booking API — "
        "Ahmedabad market edition."
    ),
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)


# ── CORS ──────────────────────────────────────────────────────────────────────
_origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins     = _origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(projects.router,  prefix="/api/projects",  tags=["Projects"])
app.include_router(leads.router,     prefix="/api/leads",     tags=["Leads"])
app.include_router(chat.router,        prefix="/api/chat",        tags=["AI Chat"])
app.include_router(visits.router,      prefix="/api/visits",      tags=["Site Visits"])
app.include_router(fact_sheets.router, prefix="/api/fact-sheets", tags=["Fact Sheets"])
app.include_router(analytics.router,   prefix="/api/analytics",   tags=["Analytics"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="API health probe")
def health() -> dict:
    return {
        "status":  "ok",
        "app":     settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api/health", tags=["Health"], summary="Detailed health check")
def api_health() -> dict:
    from app.database import engine
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {
        "status":    "ok",
        "database":  db_status,
        "app":       settings.APP_NAME,
        "version":   settings.APP_VERSION,
    }

