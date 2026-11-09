"""
models/fact_sheet.py — Project FAQ / fact-sheet entries (used by the AI chatbot).
"""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FactSheet(Base):
    __tablename__ = "fact_sheets"

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # e.g. "Pricing", "Amenities", "RERA", "Possession"
    category:   Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    question:   Mapped[str] = mapped_column(Text, nullable=False)
    answer:     Mapped[str] = mapped_column(Text, nullable=False)

    # ── Foreign Key ───────────────────────────────────────────────────────────
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)

    # ── Relationship ──────────────────────────────────────────────────────────
    project: Mapped["Project"] = relationship("Project", back_populates="fact_sheets")  # noqa: F821

    def __repr__(self) -> str:
        return f"<FactSheet id={self.id} project_id={self.project_id} category={self.category!r}>"

