"""
routers/projects.py — GET /api/projects  &  GET /api/projects/{project_id}
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.project import Project
from app.schemas.project import ProjectOut

router = APIRouter()


@router.get("/", response_model=list[ProjectOut], summary="List all RERA-registered projects")
def list_projects(db: Annotated[Session, Depends(get_db)]) -> list[ProjectOut]:
    projects = db.query(Project).all()
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut, summary="Get project by ID")
def get_project(project_id: int, db: Annotated[Session, Depends(get_db)]) -> ProjectOut:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return ProjectOut.model_validate(project)

