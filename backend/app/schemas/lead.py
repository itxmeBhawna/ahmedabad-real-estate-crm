"""
schemas/lead.py — Pydantic models for lead CRUD endpoints.
"""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.lead import LeadSource, LeadStatus


# ── Helpers ───────────────────────────────────────────────────────────────────
def _mask(phone: str) -> str:
    """DPDP-compliant masking applied before persisting."""
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        return f"+91-{digits[2:7]}-XXXXX"
    if len(digits) == 10:
        return f"+91-{digits[:5]}-XXXXX"
    return phone[:6] + "XXXXX"


# ── Request schemas ───────────────────────────────────────────────────────────
class LeadCreate(BaseModel):
    name:       str        = Field(..., min_length=2, max_length=120)
    phone:      str        = Field(..., min_length=7, max_length=15)
    source:     LeadSource
    project_id: int
    budget:     Decimal | None = Field(None, ge=0)

    @field_validator("phone", mode="before")
    @classmethod
    def apply_dpdp_mask(cls, v: str) -> str:
        return _mask(v)


class LeadUpdate(BaseModel):
    status:                LeadStatus | None = None
    assigned_executive_id: int | None        = None
    budget:                Decimal | None     = None


# ── Response schemas ──────────────────────────────────────────────────────────
class LeadOut(BaseModel):
    id:                     int
    name:                   str
    phone:                  str
    source:                 LeadSource
    budget:                 Decimal | None
    status:                 LeadStatus
    project_id:             int
    project_name:           str | None = None
    assigned_executive_id:  int | None
    assigned_executive_name: str | None = None
    created_at:             datetime
    ai_summary:             str | None = None

    model_config = {"from_attributes": True}


class DuplicateCheckOut(BaseModel):
    is_duplicate:    bool
    existing_lead_id: int | None = None
    message:         str

