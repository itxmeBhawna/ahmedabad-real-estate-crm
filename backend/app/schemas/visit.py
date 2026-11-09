"""
schemas/visit.py — Pydantic models for slot availability and visit booking.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.site_visit import VisitStatus


# ── Slot availability ─────────────────────────────────────────────────────────
class SlotRequest(BaseModel):
    project_id:   int
    date:         date
    executive_id: int | None = None   # filter by specific executive


class AvailableSlot(BaseModel):
    slot_datetime:  datetime
    executive_id:   int
    executive_name: str


class SlotResponse(BaseModel):
    date:            date
    project_id:      int
    available_slots: list[AvailableSlot]


# ── Visit CRUD ────────────────────────────────────────────────────────────────
class VisitCreate(BaseModel):
    lead_id:        int
    project_id:     int
    executive_id:   int
    visit_datetime: datetime = Field(..., description="ISO-8601 datetime with timezone")


class PublicVisitCreate(BaseModel):
    name:           str      = Field(..., min_length=2, max_length=120)
    phone:          str      = Field(..., min_length=10, max_length=15)
    project_id:     int
    slot_datetime:  datetime = Field(..., description="ISO-8601 datetime with timezone")
    executive_id:   int | None = None


class VisitUpdate(BaseModel):
    status:        VisitStatus | None = None
    reminder_sent: bool | None        = None


class VisitOut(BaseModel):
    id:              int
    lead_id:         int
    lead_name:       str | None = None
    project_id:      int
    project_name:    str | None = None
    executive_id:    int
    executive_name:  str | None = None
    visit_datetime:  datetime
    status:          VisitStatus
    reminder_sent:   bool
    created_at:      datetime

    model_config = {"from_attributes": True}

