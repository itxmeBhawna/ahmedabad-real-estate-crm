"""
routers/auth.py — POST /api/auth/login  &  GET /api/auth/me
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.security import create_access_token, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter()

_staff = require_roles(UserRole.sales_executive, UserRole.sales_head)


@router.post("/login", response_model=TokenResponse, summary="Obtain JWT access token")
def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    user: User | None = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.get("/me", response_model=UserOut, summary="Return the authenticated user's profile")
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserOut:
    return UserOut.model_validate(current_user)


@router.get("/executives", response_model=list[UserOut], summary="List all sales executives")
def list_executives(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(_staff)],
) -> list[UserOut]:
    execs = db.query(User).filter(User.role == UserRole.sales_executive).all()
    return [UserOut.model_validate(u) for u in execs]

