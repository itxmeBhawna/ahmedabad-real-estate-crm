"""
core/config.py — Centralised settings loaded from .env.
All modules import `settings` from here — single source of truth.
"""
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend/ root
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)


class Settings:
    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        secrets.token_hex(32),  # Random fallback; always set in .env for prod
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Ahmedabad Real Estate CRM"
    APP_VERSION: str = "2.0.0"

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated origins; "*" is fine for local dev, restrict in prod
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

    # ── Booking ───────────────────────────────────────────────────────────────
    # IST working-hour slot starts (24-h); lunch break excluded
    BOOKING_SLOT_HOURS: list[int] = [10, 11, 12, 14, 15, 16, 17]


settings = Settings()

