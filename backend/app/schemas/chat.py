"""
schemas/chat.py — Pydantic models for the AI chat endpoint.
"""
from enum import Enum

from pydantic import BaseModel, Field


class Language(str, Enum):
    english  = "en"
    hindi    = "hi"
    gujarati = "gu"


class ChatRequest(BaseModel):
    message:    str      = Field(..., min_length=1, max_length=1000)
    language:   Language = Language.english
    project_id: int | None = None   # narrow fact-sheet search to a project
    lead_id:    int | None = None   # attach to a lead for context logging


class ChatResponse(BaseModel):
    reply:            str
    handoff_required: bool        = False
    handoff_reason:   str | None  = None
    # Set when the bot detects a booking intent
    suggested_action: str | None  = None
    # Debug metadata (removed in prod)
    matched_category: str | None  = None

