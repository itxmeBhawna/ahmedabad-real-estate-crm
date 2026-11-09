"""
routers/leads.py — Full CRUD + duplicate-check for leads.

RBAC:
  - GET (list / detail)         → sales_executive, sales_head
  - POST (create)               → sales_executive, sales_head
  - PATCH (update status)       → sales_executive, sales_head
  - GET /check-duplicate        → sales_executive, sales_head
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_db, require_roles
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.lead import DuplicateCheckOut, LeadCreate, LeadOut, LeadUpdate

router = APIRouter()

_staff = require_roles(UserRole.sales_executive, UserRole.sales_head)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _generate_ai_summary(lead: Lead) -> str:
    proj_name = lead.project.name if lead.project else "Ahmedabad Property"
    budget_str = f"₹{float(lead.budget)/10000000:.2f} Cr" if lead.budget and lead.budget >= 10000000 else f"₹{float(lead.budget)/100000:.0f} Lakh" if lead.budget else "Undisclosed"
    source_label = {"portal": "online property portal", "social_ad": "targeted social ad campaign", "hoarding": "outdoor road hoarding"}.get(lead.source.value, lead.source.value)
    
    if lead.status == LeadStatus.visit_booked:
        return (
            f"High-intent buyer acquired via {source_label}. Engaged with AI assistant regarding {proj_name} "
            f"floor plans within budget {budget_str}. Successfully scheduled an in-person site visit. "
            f"Key focus: Verified RERA timeline, layout specifications, and dedicated parking. "
            f"Recommended action: Confirm appointment 2 hours prior and prepare developer inventory sheet."
        )
    elif lead.status == LeadStatus.contacted:
        return (
            f"Qualified prospect via {source_label} interested in {proj_name} with target budget of {budget_str}. "
            f"Initial consultation completed. Inquired regarding connectivity corridors, amenities, and possession timeline. "
            f"Recommended action: Offer exclusive weekend site walk-through slot and share brochure."
        )
    elif lead.status == LeadStatus.visited:
        return (
            f"Active warm buyer who completed site visit for {proj_name}. Inquired about corner unit availability "
            f"and payment milestones. Expressed positive interest in lifestyle amenities. "
            f"Recommended action: Send formal quotation and arrange negotiation meeting with Sales Head."
        )
    else:
        return (
            f"Fresh lead generated through {source_label} expressing initial interest in {proj_name} ({budget_str} budget). "
            f"Awaiting first discovery call from assigned executive. "
            f"Recommended action: Initiate introductory call within 15 minutes to maximize conversion."
        )


def _build_lead_out(lead: Lead) -> LeadOut:
    return LeadOut(
        id                      = lead.id,
        name                    = lead.name,
        phone                   = lead.phone,
        source                  = lead.source,
        budget                  = lead.budget,
        status                  = lead.status,
        project_id              = lead.project_id,
        project_name            = lead.project.name if lead.project else None,
        assigned_executive_id   = lead.assigned_executive_id,
        assigned_executive_name = (
            lead.assigned_executive.name if lead.assigned_executive else None
        ),
        created_at              = lead.created_at,
        ai_summary              = _generate_ai_summary(lead),
    )


def _load_lead(lead_id: int, db: Session) -> Lead:
    lead = (
        db.query(Lead)
        .options(joinedload(Lead.project), joinedload(Lead.assigned_executive))
        .filter(Lead.id == lead_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found.")
    return lead


# ── Duplicate check (before list to avoid route shadowing) ────────────────────
@router.get(
    "/check-duplicate",
    response_model=DuplicateCheckOut,
    summary="Check if a masked phone number already exists as a lead",
)
def check_duplicate(
    phone: str = Query(..., description="Masked phone e.g. +91-98765-XXXXX"),
    project_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _user: User = Depends(_staff),
) -> DuplicateCheckOut:
    q = db.query(Lead).filter(Lead.phone == phone)
    if project_id:
        q = q.filter(Lead.project_id == project_id)
    existing = q.first()
    if existing:
        return DuplicateCheckOut(
            is_duplicate=True,
            existing_lead_id=existing.id,
            message=f"Duplicate lead found (ID {existing.id}) with status '{existing.status.value}'.",
        )
    return DuplicateCheckOut(is_duplicate=False, message="No duplicate found.")


# ── List ──────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[LeadOut], summary="List all leads with optional filters")
def list_leads(
    source:     LeadSource | None = Query(None),
    status_:    LeadStatus | None = Query(None, alias="status"),
    project_id: int | None        = Query(None),
    exec_id:    int | None        = Query(None, alias="executive_id"),
    skip:       int               = Query(0, ge=0),
    limit:      int               = Query(50, ge=1, le=200),
    db:         Session           = Depends(get_db),
    current_user: User            = Depends(_staff),
) -> list[LeadOut]:
    q = db.query(Lead).options(
        joinedload(Lead.project), joinedload(Lead.assigned_executive)
    )
    if source:
        q = q.filter(Lead.source == source)
    if status_:
        q = q.filter(Lead.status == status_)
    if project_id:
        q = q.filter(Lead.project_id == project_id)
    if exec_id:
        q = q.filter(Lead.assigned_executive_id == exec_id)
    # Executives only see their own leads
    if current_user.role == UserRole.sales_executive:
        q = q.filter(Lead.assigned_executive_id == current_user.id)

    leads = q.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return [_build_lead_out(l) for l in leads]


# ── Create ────────────────────────────────────────────────────────────────────
@router.post("/", response_model=LeadOut, status_code=201, summary="Create a new lead")
def create_lead(
    payload:      LeadCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(_staff),
) -> LeadOut:
    # Soft duplicate guard
    existing = db.query(Lead).filter(
        Lead.phone == payload.phone, Lead.project_id == payload.project_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Lead with this phone already exists for project (ID {existing.id}).",
        )

    # Validate project exists
    if not db.query(Project).filter(Project.id == payload.project_id).first():
        raise HTTPException(status_code=404, detail="Project not found.")

    lead = Lead(
        name                  = payload.name,
        phone                 = payload.phone,     # already DPDP-masked by schema validator
        source                = payload.source,
        budget                = payload.budget,
        project_id            = payload.project_id,
        assigned_executive_id = current_user.id if current_user.role == UserRole.sales_executive else None,
        status                = LeadStatus.new,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _build_lead_out(_load_lead(lead.id, db))


# ── Detail ────────────────────────────────────────────────────────────────────
@router.get("/{lead_id}", response_model=LeadOut, summary="Get a single lead by ID")
def get_lead(
    lead_id: int,
    db:      Session = Depends(get_db),
    _user:   User    = Depends(_staff),
) -> LeadOut:
    return _build_lead_out(_load_lead(lead_id, db))


# ── Update ────────────────────────────────────────────────────────────────────
@router.patch("/{lead_id}", response_model=LeadOut, summary="Update lead status or assignment")
def update_lead(
    lead_id:  int,
    payload:  LeadUpdate,
    db:       Session = Depends(get_db),
    _user:    User    = Depends(_staff),
) -> LeadOut:
    lead = _load_lead(lead_id, db)

    if payload.status is not None:
        lead.status = payload.status
    if payload.assigned_executive_id is not None:
        exec_ = db.query(User).filter(
            User.id == payload.assigned_executive_id,
            User.role == UserRole.sales_executive,
        ).first()
        if not exec_:
            raise HTTPException(
                status_code=404, detail="Sales executive not found."
            )
        lead.assigned_executive_id = payload.assigned_executive_id
    if payload.budget is not None:
        lead.budget = payload.budget

    db.commit()
    db.refresh(lead)
    return _build_lead_out(_load_lead(lead_id, db))

