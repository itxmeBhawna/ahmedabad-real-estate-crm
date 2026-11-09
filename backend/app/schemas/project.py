"""
schemas/project.py — Pydantic models for Real Estate Projects.
"""
from pydantic import BaseModel


class ProjectOut(BaseModel):
    id: int
    name: str
    location: str
    rera_number: str
    price_range: str
    configurations: str
    description: str | None = None

    model_config = {"from_attributes": True}

