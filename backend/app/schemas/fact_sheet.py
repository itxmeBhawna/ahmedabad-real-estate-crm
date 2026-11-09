"""
schemas/fact_sheet.py — Pydantic models for Fact Sheet knowledge base.
"""
from pydantic import BaseModel, Field


class FactSheetBase(BaseModel):
    category: str = Field(..., min_length=2, max_length=100)
    question: str = Field(..., min_length=3)
    answer: str = Field(..., min_length=3)
    project_id: int


class FactSheetCreate(FactSheetBase):
    pass


class FactSheetUpdate(BaseModel):
    category: str | None = Field(None, min_length=2, max_length=100)
    question: str | None = Field(None, min_length=3)
    answer: str | None = Field(None, min_length=3)
    project_id: int | None = None


class FactSheetOut(FactSheetBase):
    id: int
    project_name: str | None = None

    model_config = {"from_attributes": True}

