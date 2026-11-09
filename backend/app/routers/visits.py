"""
routers/visits.py — Slot availability, visit booking, list & status updates.

RBAC:
  - GET /slots       → authenticated (all roles — buyers need to see slots)
  - POST /           → authenticated
  - GET /            → sales_executive, sales_head
  - PATCH /{id}      → sales_executive, sales_head
"""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, get_optional_current_user, require_roles
from app.models.site_visit import SiteVisit, VisitStatus
from app.models.user import User, UserRole
from app.schemas.visit import PublicVisitCreate, SlotResponse, VisitCreate, VisitOut, VisitUpdate
from app.services.booking_service import booking_service

router = APIRouter()

_staff = require_roles(UserRole.sales_executive, UserRole.sales_head)


# ── Available slots ───────────────────────────────────────────────────────────
@router.get(
    "/slots",
    response_model=SlotResponse,
    summary="Get available time slots for a project on a given date",
)
def get_slots(
    project_id:   int          = Query(...),
    visit_date:   date         = Query(..., alias="date"),
    executive_id: int | None   = Query(None),
    db:           Session      = Depends(get_db),
    _user:        User | None  = Depends(get_optional_current_user),
) -> SlotResponse:
    return booking_service.get_available_slots(
        project_id   = project_id,
        visit_date   = visit_date,
        db           = db,
        executive_id = executive_id,
    )


# ── Book a visit (staff / authenticated) ──────────────────────────────────────
@router.post(
    "/",
    response_model=VisitOut,
    status_code=201,
    summary="Book a site visit (auto-advances lead status to 'Visit Booked')",
)
def book_visit(
    payload: VisitCreate,
    db:      Session = Depends(get_db),
    _user:   User    = Depends(get_current_user),
) -> VisitOut:
    return booking_service.book_visit(payload, db)


# ── Book a public visit (prospective buyer on web) ───────────────────────────
@router.post(
    "/book-public",
    response_model=VisitOut,
    status_code=201,
    summary="Book a site visit directly as a prospective buyer",
)
def book_public_visit(
    payload: PublicVisitCreate,
    db:      Session = Depends(get_db),
) -> VisitOut:
    return booking_service.book_public_visit(payload, db)


# ── List visits ───────────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=list[VisitOut],
    summary="List site visits (executives see only their own)",
)
def list_visits(
    status_:    VisitStatus | None = Query(None, alias="status"),
    project_id: int | None         = Query(None),
    lead_id:    int | None         = Query(None),
    skip:       int                = Query(0, ge=0),
    limit:      int                = Query(50, ge=1, le=200),
    db:         Session            = Depends(get_db),
    current_user: User             = Depends(_staff),
) -> list[VisitOut]:
    q = db.query(SiteVisit)
    if status_:
        q = q.filter(SiteVisit.status == status_)
    if project_id:
        q = q.filter(SiteVisit.project_id == project_id)
    if lead_id:
        q = q.filter(SiteVisit.lead_id == lead_id)
    if current_user.role == UserRole.sales_executive:
        q = q.filter(SiteVisit.executive_id == current_user.id)

    visits = q.order_by(SiteVisit.visit_datetime).offset(skip).limit(limit).all()
    return [booking_service._visit_out(v, db) for v in visits]


# ── Update visit status ───────────────────────────────────────────────────────
@router.patch(
    "/{visit_id}",
    response_model=VisitOut,
    summary="Update visit status (Completed / Cancelled) or mark reminder sent",
)
def update_visit(
    visit_id: int,
    payload:  VisitUpdate,
    db:       Session = Depends(get_db),
    _user:    User    = Depends(_staff),
) -> VisitOut:
    return booking_service.update_visit(
        visit_id      = visit_id,
        status        = payload.status,
        reminder_sent = payload.reminder_sent,
        db            = db,
    )

