"""
routers/analytics.py — CRM performance metrics for sales head / executive dashboards.

Endpoints:
  GET /api/analytics/overview          → headline KPIs
  GET /api/analytics/lead-sources      → lead count by acquisition source
  GET /api/analytics/visit-status      → visit count by status
  GET /api/analytics/conversion-funnel → lead count at each pipeline stage
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_roles
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.site_visit import SiteVisit, VisitStatus
from app.models.user import User, UserRole

router = APIRouter()

_staff      = require_roles(UserRole.sales_executive, UserRole.sales_head)
_head_only  = require_roles(UserRole.sales_head)


# ── Overview ──────────────────────────────────────────────────────────────────
@router.get("/overview", summary="Headline KPI summary")
def overview(
    db:   Annotated[Session, Depends(get_db)],
    _u:   Annotated[User,    Depends(_staff)],
) -> dict:
    total_leads   = db.query(func.count(Lead.id)).scalar() or 0
    total_visits  = db.query(func.count(SiteVisit.id)).scalar() or 0
    booked        = db.query(func.count(SiteVisit.id)).filter(SiteVisit.status == VisitStatus.booked).scalar() or 0
    completed     = db.query(func.count(SiteVisit.id)).filter(SiteVisit.status == VisitStatus.completed).scalar() or 0
    cancelled     = db.query(func.count(SiteVisit.id)).filter(SiteVisit.status == VisitStatus.cancelled).scalar() or 0
    visited_leads = db.query(func.count(Lead.id)).filter(Lead.status == LeadStatus.visited).scalar() or 0

    conversion_rate = round(visited_leads / total_leads * 100, 1) if total_leads else 0.0

    return {
        "total_leads":      total_leads,
        "total_visits":     total_visits,
        "booked_visits":    booked,
        "completed_visits": completed,
        "cancelled_visits": cancelled,
        "conversion_rate":  f"{conversion_rate}%",
    }


# ── Lead sources ───────────────────────────────────────────────────────────────
@router.get("/lead-sources", summary="Lead count by acquisition source")
def lead_sources(
    db: Annotated[Session, Depends(get_db)],
    _u: Annotated[User,    Depends(_staff)],
) -> list[dict]:
    rows = (
        db.query(Lead.source, func.count(Lead.id).label("count"))
        .group_by(Lead.source)
        .all()
    )
    total = sum(r.count for r in rows) or 1
    return [
        {
            "source":     r.source.value,
            "count":      r.count,
            "percentage": f"{round(r.count / total * 100, 1)}%",
        }
        for r in rows
    ]


# ── Visit status ───────────────────────────────────────────────────────────────
@router.get("/visit-status", summary="Site-visit count by status")
def visit_status(
    db: Annotated[Session, Depends(get_db)],
    _u: Annotated[User,    Depends(_staff)],
) -> list[dict]:
    rows = (
        db.query(SiteVisit.status, func.count(SiteVisit.id).label("count"))
        .group_by(SiteVisit.status)
        .all()
    )
    return [{"status": r.status.value, "count": r.count} for r in rows]


# ── Conversion funnel ──────────────────────────────────────────────────────────
@router.get("/conversion-funnel", summary="Lead count at each pipeline stage (ordered)")
def conversion_funnel(
    db: Annotated[Session, Depends(get_db)],
    _u: Annotated[User,    Depends(_staff)],
) -> list[dict]:
    stage_order = [
        LeadStatus.new,
        LeadStatus.contacted,
        LeadStatus.visit_booked,
        LeadStatus.visited,
    ]
    rows = (
        db.query(Lead.status, func.count(Lead.id).label("count"))
        .group_by(Lead.status)
        .all()
    )
    counts = {r.status: r.count for r in rows}
    return [
        {"stage": s.value, "count": counts.get(s, 0)}
        for s in stage_order
    ]

