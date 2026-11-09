"""
routers/fact_sheets.py — Admin Fact Sheet management endpoints.
Allows sales_head to view, add, update, and remove project FAQs & fact-sheet grounding data.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_db, require_roles
from app.models.fact_sheet import FactSheet
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.fact_sheet import FactSheetCreate, FactSheetOut, FactSheetUpdate

router = APIRouter()

_staff = require_roles(UserRole.sales_executive, UserRole.sales_head)
_head_only = require_roles(UserRole.sales_head)


def _build_fact_sheet_out(item: FactSheet) -> FactSheetOut:
    return FactSheetOut(
        id=item.id,
        category=item.category,
        question=item.question,
        answer=item.answer,
        project_id=item.project_id,
        project_name=item.project.name if item.project else None,
    )


@router.get("/", response_model=list[FactSheetOut], summary="List all fact sheet entries")
def list_fact_sheets(
    project_id: int | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    _user: User = Depends(_staff),
) -> list[FactSheetOut]:
    q = db.query(FactSheet).options(joinedload(FactSheet.project))
    if project_id:
        q = q.filter(FactSheet.project_id == project_id)
    if category:
        q = q.filter(FactSheet.category == category)
    items = q.order_by(FactSheet.category, FactSheet.id).all()
    return [_build_fact_sheet_out(i) for i in items]


@router.post("/", response_model=FactSheetOut, status_code=201, summary="Create a fact sheet entry")
def create_fact_sheet(
    payload: FactSheetCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(_head_only),
) -> FactSheetOut:
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    item = FactSheet(
        category=payload.category.strip(),
        question=payload.question.strip(),
        answer=payload.answer.strip(),
        project_id=payload.project_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_fact_sheet_out(item)


@router.put("/{fact_sheet_id}", response_model=FactSheetOut, summary="Update a fact sheet entry")
def update_fact_sheet(
    fact_sheet_id: int,
    payload: FactSheetUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(_head_only),
) -> FactSheetOut:
    item = db.query(FactSheet).filter(FactSheet.id == fact_sheet_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Fact sheet entry not found.")

    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.question is not None:
        item.question = payload.question.strip()
    if payload.answer is not None:
        item.answer = payload.answer.strip()
    if payload.project_id is not None:
        project = db.query(Project).filter(Project.id == payload.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        item.project_id = payload.project_id

    db.commit()
    db.refresh(item)
    return _build_fact_sheet_out(item)


@router.delete("/{fact_sheet_id}", status_code=204, summary="Delete a fact sheet entry")
def delete_fact_sheet(
    fact_sheet_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(_head_only),
):
    item = db.query(FactSheet).filter(FactSheet.id == fact_sheet_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Fact sheet entry not found.")
    db.delete(item)
    db.commit()
    return None

