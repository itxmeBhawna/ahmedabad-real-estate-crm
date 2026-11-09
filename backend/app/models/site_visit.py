"""
models/site_visit.py — Scheduled / completed site visits.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VisitStatus(str, enum.Enum):
    booked    = "Booked"
    completed = "Completed"
    cancelled = "Cancelled"


class SiteVisit(Base):
    __tablename__ = "site_visits"

    id:             Mapped[int]         = mapped_column(Integer, primary_key=True, index=True)
    visit_datetime: Mapped[datetime]    = mapped_column(DateTime(timezone=True), nullable=False)
    status:         Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus), nullable=False, default=VisitStatus.booked
    )
    reminder_sent:  Mapped[bool]        = mapped_column(Boolean, nullable=False, default=False)
    created_at:     Mapped[datetime]    = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    lead_id:      Mapped[int] = mapped_column(ForeignKey("leads.id"),    nullable=False, index=True)
    project_id:   Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    executive_id: Mapped[int] = mapped_column(ForeignKey("users.id"),    nullable=False, index=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    lead:      Mapped["Lead"]    = relationship("Lead",    back_populates="site_visits")                      # noqa: F821
    project:   Mapped["Project"] = relationship("Project", back_populates="site_visits")                      # noqa: F821
    executive: Mapped["User"]    = relationship("User",    back_populates="site_visits",                      # noqa: F821
                                                foreign_keys=[executive_id])

    def __repr__(self) -> str:
        return (
            f"<SiteVisit id={self.id} lead_id={self.lead_id} "
            f"visit_datetime={self.visit_datetime} status={self.status}>"
        )

