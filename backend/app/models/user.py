"""
models/user.py — Platform users (buyers, sales executives, sales heads).
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    buyer            = "buyer"
    sales_executive  = "sales_executive"
    sales_head       = "sales_head"


class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    name:            Mapped[str]      = mapped_column(String(120), nullable=False)
    email:           Mapped[str]      = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str]      = mapped_column(String(255), nullable=False)
    role:            Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.buyer)
    created_at:      Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────────
    # Leads this executive is assigned to
    assigned_leads: Mapped[list["Lead"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Lead", back_populates="assigned_executive", foreign_keys="Lead.assigned_executive_id"
    )
    # Site visits this executive is responsible for
    site_visits: Mapped[list["SiteVisit"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "SiteVisit", back_populates="executive", foreign_keys="SiteVisit.executive_id"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name!r} role={self.role}>"

