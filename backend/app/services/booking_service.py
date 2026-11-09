"""
services/booking_service.py — Conflict-free site-visit slot management.

Business rules:
  - Working slots: Mon–Sat, 10:00–17:00 IST (lunch gap 13:00 excluded).
  - An executive can hold only ONE visit per 1-hour slot.
  - Booking a visit auto-updates the lead's status to "Visit Booked".
  - Slot resolution uses IST (UTC+5:30) throughout.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.project import Project
from app.models.site_visit import SiteVisit, VisitStatus
from app.models.user import User, UserRole
from app.schemas.lead import _mask
from app.schemas.visit import AvailableSlot, PublicVisitCreate, SlotResponse, VisitCreate, VisitOut

_IST = timezone(timedelta(hours=5, minutes=30))


def _ist_now() -> datetime:
    return datetime.now(tz=_IST)


def _slot_dt(d: date, hour: int) -> datetime:
    """Return a timezone-aware IST datetime for *d* at *hour*:00:00."""
    return datetime(d.year, d.month, d.day, hour, 0, 0, tzinfo=_IST)


class BookingService:
    """Stateless — one instance per application."""

    # ── Slot availability ─────────────────────────────────────────────────────
    def get_available_slots(
        self,
        project_id: int,
        visit_date: date,
        db: Session,
        executive_id: int | None = None,
    ) -> SlotResponse:
        # No bookings on Sundays (weekday 6 = Sunday)
        if visit_date.weekday() == 6:
            return SlotResponse(
                date=visit_date, project_id=project_id, available_slots=[]
            )

        # Past dates are unavailable
        if visit_date < _ist_now().date():
            return SlotResponse(
                date=visit_date, project_id=project_id, available_slots=[]
            )

        # Get eligible executives
        exec_query = db.query(User).filter(User.role == UserRole.sales_executive)
        if executive_id:
            exec_query = exec_query.filter(User.id == executive_id)
        executives = exec_query.all()

        # Pre-fetch all existing visits for this date to avoid N+1 queries
        day_start = _slot_dt(visit_date, 0)
        day_end   = day_start + timedelta(days=1)
        booked = (
            db.query(SiteVisit)
            .filter(
                SiteVisit.project_id == project_id,
                SiteVisit.visit_datetime >= day_start,
                SiteVisit.visit_datetime < day_end,
                SiteVisit.status != VisitStatus.cancelled,
            )
            .all()
        )
        # {(executive_id, hour) → True}
        booked_set: set[tuple[int, int]] = {
            (v.executive_id, v.visit_datetime.astimezone(_IST).hour) for v in booked
        }

        slots: list[AvailableSlot] = []
        for slot_hour in settings.BOOKING_SLOT_HOURS:
            slot_dt = _slot_dt(visit_date, slot_hour)
            # Skip slots in the past (same-day check)
            if slot_dt <= _ist_now():
                continue
            for exec_obj in executives:
                if (exec_obj.id, slot_hour) not in booked_set:
                    slots.append(
                        AvailableSlot(
                            slot_datetime=slot_dt,
                            executive_id=exec_obj.id,
                            executive_name=exec_obj.name,
                        )
                    )

        return SlotResponse(
            date=visit_date, project_id=project_id, available_slots=slots
        )

    # ── Book a visit ──────────────────────────────────────────────────────────
    def book_visit(self, payload: VisitCreate, db: Session) -> VisitOut:
        visit_dt = payload.visit_datetime.astimezone(_IST)

        # Guard: Sunday block
        if visit_dt.weekday() == 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Site visits are not conducted on Sundays.",
            )

        # Guard: past datetime
        if visit_dt <= _ist_now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot book a visit in the past.",
            )

        # Guard: slot hour must be in allowed set
        if visit_dt.hour not in settings.BOOKING_SLOT_HOURS:
            allowed = ", ".join(f"{h:02d}:00" for h in settings.BOOKING_SLOT_HOURS)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid slot. Allowed hours (IST): {allowed}.",
            )

        # Guard: double-booking check for the same executive
        conflict = (
            db.query(SiteVisit)
            .filter(
                SiteVisit.executive_id == payload.executive_id,
                SiteVisit.visit_datetime == visit_dt,
                SiteVisit.status != VisitStatus.cancelled,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Selected executive already has a visit booked for this slot.",
            )

        # Guard: lead exists
        lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found.")

        # Create visit
        visit = SiteVisit(
            lead_id        = payload.lead_id,
            project_id     = payload.project_id,
            executive_id   = payload.executive_id,
            visit_datetime = visit_dt,
            status         = VisitStatus.booked,
            reminder_sent  = False,
        )
        db.add(visit)

        # Auto-advance lead status to "Visit Booked"
        if lead.status not in (LeadStatus.visit_booked, LeadStatus.visited):
            lead.status = LeadStatus.visit_booked

        db.commit()
        db.refresh(visit)
        db.refresh(lead)

        # Build enriched response
        return self._visit_out(visit, db)

    # ── Book a public visit (from buyer portal) ───────────────────────────────
    def book_public_visit(self, payload: PublicVisitCreate, db: Session) -> VisitOut:
        project = db.query(Project).filter(Project.id == payload.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        masked_phone = _mask(payload.phone)

        # Check or create Lead
        lead = db.query(Lead).filter(
            Lead.phone == masked_phone,
            Lead.project_id == payload.project_id,
        ).first()

        # If executive_id not specified, find an available executive for that slot
        visit_dt = payload.slot_datetime.astimezone(_IST)
        target_exec_id = payload.executive_id

        if not target_exec_id:
            # find an executive who is free
            execs = db.query(User).filter(User.role == UserRole.sales_executive).all()
            busy_exec_ids = {
                v.executive_id
                for v in db.query(SiteVisit)
                .filter(
                    SiteVisit.visit_datetime == visit_dt,
                    SiteVisit.status != VisitStatus.cancelled,
                )
                .all()
            }
            available = [e for e in execs if e.id not in busy_exec_ids]
            if not available:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No sales executives are available for this slot. Please choose another time.",
                )
            target_exec_id = available[0].id

        if not lead:
            lead = Lead(
                name=payload.name,
                phone=masked_phone,
                source=LeadSource.portal,
                project_id=payload.project_id,
                assigned_executive_id=target_exec_id,
                status=LeadStatus.visit_booked,
            )
            db.add(lead)
            db.commit()
            db.refresh(lead)

        visit_create = VisitCreate(
            lead_id=lead.id,
            project_id=payload.project_id,
            executive_id=target_exec_id,
            visit_datetime=payload.slot_datetime,
        )
        return self.book_visit(visit_create, db)

    # ── Update visit ──────────────────────────────────────────────────────────
    def update_visit(
        self, visit_id: int, status: VisitStatus | None, reminder_sent: bool | None, db: Session
    ) -> VisitOut:
        visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found.")

        if status is not None:
            visit.status = status
            # If completed, advance lead status
            if status == VisitStatus.completed:
                lead = db.query(Lead).filter(Lead.id == visit.lead_id).first()
                if lead:
                    lead.status = LeadStatus.visited
        if reminder_sent is not None:
            visit.reminder_sent = reminder_sent

        db.commit()
        db.refresh(visit)
        return self._visit_out(visit, db)

    # ── Helper ────────────────────────────────────────────────────────────────
    @staticmethod
    def _visit_out(visit: SiteVisit, db: Session) -> VisitOut:
        from app.models.lead import Lead
        from app.models.project import Project

        lead    = db.query(Lead).filter(Lead.id == visit.lead_id).first()
        project = db.query(Project).filter(Project.id == visit.project_id).first()
        exec_   = db.query(User).filter(User.id == visit.executive_id).first()

        return VisitOut(
            id             = visit.id,
            lead_id        = visit.lead_id,
            lead_name      = lead.name if lead else None,
            project_id     = visit.project_id,
            project_name   = project.name if project else None,
            executive_id   = visit.executive_id,
            executive_name = exec_.name if exec_ else None,
            visit_datetime = visit.visit_datetime,
            status         = visit.status,
            reminder_sent  = visit.reminder_sent,
            created_at     = visit.created_at,
        )


booking_service = BookingService()

