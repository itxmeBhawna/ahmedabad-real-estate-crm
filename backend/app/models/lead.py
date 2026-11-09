"""
models/lead.py — Prospective buyers (DPDP-compliant phone masking applied at seed/write time).
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LeadSource(str, enum.Enum):
    portal     = "portal"
    social_ad  = "social_ad"
    hoarding   = "hoarding"


class LeadStatus(str, enum.Enum):
    new          = "New"
    contacted    = "Contacted"
    visit_booked = "Visit Booked"
    visited      = "Visited"


class Lead(Base):
    __tablename__ = "leads"

    id:                   Mapped[int]        = mapped_column(Integer, primary_key=True, index=True)
    name:                 Mapped[str]        = mapped_column(String(120), nullable=False)
    # Stored masked for DPDP compliance — e.g. "+91-98765-XXXXX"
    phone:                Mapped[str]        = mapped_column(String(30), nullable=False)
    source:               Mapped[LeadSource] = mapped_column(Enum(LeadSource), nullable=False)
    budget:               Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    status:               Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus), nullable=False, default=LeadStatus.new
    )
    created_at:           Mapped[datetime]   = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    project_id:            Mapped[int]      = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    assigned_executive_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    project:            Mapped["Project"] = relationship("Project", back_populates="leads")  # noqa: F821
    assigned_executive: Mapped["User | None"] = relationship(                                # noqa: F821
        "User", back_populates="assigned_leads", foreign_keys=[assigned_executive_id]
    )
    site_visits: Mapped[list["SiteVisit"]] = relationship("SiteVisit", back_populates="lead")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Lead id={self.id} name={self.name!r} status={self.status}>"

