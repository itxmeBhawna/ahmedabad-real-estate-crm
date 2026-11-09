"""
core/dependencies.py — FastAPI dependency-injection helpers.

Provides:
  - get_db()           → SQLAlchemy session
  - get_current_user() → authenticated User ORM object
  - require_roles()    → role-guard factory (returns a Depends-able callable)
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import SessionLocal
from app.models.user import User, UserRole

_bearer = HTTPBearer(auto_error=True)
_optional_bearer = HTTPBearer(auto_error=False)


# ── Database session ─────────────────────────────────────────────────────────
def get_db() -> Session:
    """Yield a SQLAlchemy session and close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Authentication ────────────────────────────────────────────────────────────
def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Extract and validate the Bearer JWT; return the matching User row."""
    exc_401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        raw_id = payload.get("sub")
        if raw_id is None:
            raise exc_401
        user_id = int(raw_id)
    except (ValueError, TypeError):
        raise exc_401

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise exc_401
    return user


def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_optional_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    """Return authenticated User if valid Bearer token provided, otherwise None."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        raw_id = payload.get("sub")
        if raw_id is None:
            return None
        user_id = int(raw_id)
        return db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        return None


# ── RBAC guard factory ────────────────────────────────────────────────────────
def require_roles(*roles: UserRole):
    """
    Returns a FastAPI dependency that passes only if the current user has
    one of the specified roles.

    Usage::

        @router.get("/admin-only")
        def admin_view(user = Depends(require_roles(UserRole.sales_head))):
            ...
    """

    def _guard(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[r.value for r in roles]}",
            )
        return current_user

    return _guard

