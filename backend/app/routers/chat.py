"""
routers/chat.py — POST /api/chat  (AI chat with fact-sheet grounding)
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_optional_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import ai_service

router = APIRouter()


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Send a buyer message; get a fact-sheet-grounded AI reply",
)
def chat(
    payload: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
) -> ChatResponse:
    return ai_service.get_response(
        message    = payload.message,
        language   = payload.language,
        db         = db,
        project_id = payload.project_id,
    )

