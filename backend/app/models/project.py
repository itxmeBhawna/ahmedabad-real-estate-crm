"""
models/project.py — Real-estate projects (RERA-registered properties).
"""
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id:             Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name:           Mapped[str] = mapped_column(String(200), nullable=False)
    location:       Mapped[str] = mapped_column(String(200), nullable=False)
    rera_number:    Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    # e.g. "₹85L – ₹1.4Cr"
    price_range:    Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g. "2 BHK, 3 BHK"
    configurations: Mapped[str] = mapped_column(String(200), nullable=False)
    description:    Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────────────────
    leads:       Mapped[list["Lead"]]      = relationship("Lead",      back_populates="project")       # noqa: F821
    fact_sheets: Mapped[list["FactSheet"]] = relationship("FactSheet", back_populates="project")       # noqa: F821
    site_visits: Mapped[list["SiteVisit"]] = relationship("SiteVisit", back_populates="project")       # noqa: F821

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name!r} rera={self.rera_number!r}>"

