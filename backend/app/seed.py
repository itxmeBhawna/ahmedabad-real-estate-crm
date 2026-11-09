"""
seed.py — Populates the database with realistic Ahmedabad sample data.

Run:
    cd backend
    python -m app.seed
"""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Make sure `app` is importable when running from the backend/ directory ───
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, create_all_tables
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.fact_sheet import FactSheet
from app.models.site_visit import SiteVisit, VisitStatus
from app.core.security import hash_password as _hash_password


def _mask_phone(phone: str) -> str:
    """DPDP-compliant masking: show country code + first 5 digits only."""
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 12 and digits.startswith("91"):   # +91XXXXXXXXXX
        return f"+91-{digits[2:7]}-XXXXX"
    if len(digits) == 10:
        return f"+91-{digits[:5]}-XXXXX"
    return phone[:6] + "XXXXX"


def _ist(year, month, day, hour=10, minute=0) -> datetime:
    """Return a timezone-aware datetime in IST (UTC+5:30)."""
    IST = timezone(timedelta(hours=5, minutes=30))
    return datetime(year, month, day, hour, minute, tzinfo=IST)


# ── Seed function ─────────────────────────────────────────────────────────────
def seed() -> None:
    create_all_tables()
    db = SessionLocal()

    try:
        # ── Guard: skip if already seeded ────────────────────────────────────
        if db.query(Project).count() > 0:
            print("[Seed] Database already seeded — skipping.")
            return

        # ── 1. Projects ───────────────────────────────────────────────────────
        project_sg = Project(
            name           = "Shivalik Grand",
            location       = "Bopal, Ahmedabad",
            rera_number    = "PR/GJ/AHMEDABAD/AHMEDABAD CITY/AAA01234/310125",
            price_range    = "₹85L – ₹1.4Cr",
            configurations = "2 BHK, 3 BHK",
            description    = (
                "Premium gated community with 3 acres of open spaces, "
                "clubhouse, and rooftop infinity pool. RERA approved. "
                "Possession Q2 2026."
            ),
        )
        project_ar = Project(
            name           = "Aavkar Residency",
            location       = "South Bopal, Ahmedabad",
            rera_number    = "PR/GJ/AHMEDABAD/AHMEDABAD CITY/BBB05678/310125",
            price_range    = "₹62L – ₹95L",
            configurations = "1 BHK, 2 BHK",
            description    = (
                "Affordable mid-segment housing with modern amenities. "
                "Metro-corridor connectivity. Possession Q4 2025."
            ),
        )
        db.add_all([project_sg, project_ar])
        db.flush()   # get PKs without committing

        # ── 2. Users ──────────────────────────────────────────────────────────
        sales_head = User(
            name            = "Amit Desai",
            email           = "amit.desai@realty.in",
            hashed_password = _hash_password("HeadPass@2025"),
            role            = UserRole.sales_head,
        )
        exec_rahul = User(
            name            = "Rahul Chouhan",
            email           = "rahul.chouhan@realty.in",
            hashed_password = _hash_password("Exec@2025!"),
            role            = UserRole.sales_executive,
        )
        exec_priya = User(
            name            = "Priya Mehta",
            email           = "priya.mehta@realty.in",
            hashed_password = _hash_password("Exec@2025!"),
            role            = UserRole.sales_executive,
        )
        db.add_all([sales_head, exec_rahul, exec_priya])
        db.flush()

        # ── 3. Leads ──────────────────────────────────────────────────────────
        lead_hardik = Lead(
            name                  = "Hardik Patel",
            phone                 = _mask_phone("9876543210"),    # +91-98765-XXXXX
            source                = LeadSource.portal,
            budget                = 12_500_000.00,                # ₹1.25 Cr
            status                = LeadStatus.visit_booked,
            project_id            = project_sg.id,
            assigned_executive_id = exec_rahul.id,
        )
        lead_nidhi = Lead(
            name                  = "Nidhi Shah",
            phone                 = _mask_phone("9123456789"),
            source                = LeadSource.social_ad,
            budget                = 7_500_000.00,                 # ₹75L
            status                = LeadStatus.contacted,
            project_id            = project_ar.id,
            assigned_executive_id = exec_priya.id,
        )
        lead_kavita = Lead(
            name                  = "Kavita Joshi",
            phone                 = _mask_phone("9988776655"),
            source                = LeadSource.hoarding,
            budget                = 9_000_000.00,                 # ₹90L
            status                = LeadStatus.new,
            project_id            = project_sg.id,
            assigned_executive_id = exec_rahul.id,
        )
        db.add_all([lead_hardik, lead_nidhi, lead_kavita])
        db.flush()

        # ── 4. Site Visit ─────────────────────────────────────────────────────
        # Hardik Patel — upcoming booked site visit
        visit_hardik = SiteVisit(
            lead_id        = lead_hardik.id,
            project_id     = project_sg.id,
            executive_id   = exec_rahul.id,
            visit_datetime = _ist(2026, 11, 15, 11, 0),   # 15-Nov-2026 11:00 IST
            status         = VisitStatus.booked,
            reminder_sent  = False,
        )
        db.add(visit_hardik)

        # ── 5. Fact Sheet ─────────────────────────────────────────────────────
        fact_sheets_sg = [
            # Pricing
            FactSheet(project_id=project_sg.id, category="Pricing",
                      question="What is the price of a 2 BHK in Shivalik Grand?",
                      answer="2 BHK units are priced between ₹85 Lakh and ₹1.05 Crore, "
                             "depending on the floor and view."),
            FactSheet(project_id=project_sg.id, category="Pricing",
                      question="What is the price of a 3 BHK in Shivalik Grand?",
                      answer="3 BHK units range from ₹1.1 Crore to ₹1.4 Crore. "
                             "Corner units on higher floors command a premium."),
            # Amenities
            FactSheet(project_id=project_sg.id, category="Amenities",
                      question="What amenities does Shivalik Grand offer?",
                      answer="Rooftop infinity pool, fully-equipped gym, landscaped gardens "
                             "(3 acres), multi-purpose clubhouse, children's play area, "
                             "24×7 security, and dedicated EV charging stations."),
            FactSheet(project_id=project_sg.id, category="Amenities",
                      question="Is there a parking provision?",
                      answer="Every unit gets one covered car parking. Additional stilt "
                             "parking is available at ₹2.5L extra."),
            # RERA
            FactSheet(project_id=project_sg.id, category="RERA",
                      question="What is the RERA registration number for Shivalik Grand?",
                      answer="RERA No. PR/GJ/AHMEDABAD/AHMEDABAD CITY/AAA01234/310125 — "
                             "registered with Gujarat RERA (gujrera.gov.in)."),
            FactSheet(project_id=project_sg.id, category="RERA",
                      question="When is the RERA-approved possession date?",
                      answer="Q2 2026 (June 2026) as per the RERA filing."),
            # Possession & Location
            FactSheet(project_id=project_sg.id, category="Location",
                      question="How far is Shivalik Grand from SG Highway?",
                      answer="Approximately 3 km from Sarkhej–Gandhinagar Highway, "
                             "accessible via Bopal–Ghuma road."),
        ]

        fact_sheets_ar = [
            FactSheet(project_id=project_ar.id, category="Pricing",
                      question="What is the starting price at Aavkar Residency?",
                      answer="1 BHK units start at ₹62 Lakh. 2 BHK units start at ₹78 Lakh."),
            FactSheet(project_id=project_ar.id, category="Amenities",
                      question="What amenities are available at Aavkar Residency?",
                      answer="Community hall, jogging track, children's play area, "
                             "CCTV surveillance, and covered parking."),
            FactSheet(project_id=project_ar.id, category="RERA",
                      question="What is the RERA number for Aavkar Residency?",
                      answer="RERA No. PR/GJ/AHMEDABAD/AHMEDABAD CITY/BBB05678/310125."),
            FactSheet(project_id=project_ar.id, category="Location",
                      question="Is Aavkar Residency near a metro station?",
                      answer="Yes — it is 1.2 km from the South Bopal Metro Station "
                             "(Ahmedabad Metro Phase 2 corridor)."),
        ]

        db.add_all(fact_sheets_sg + fact_sheets_ar)

        # ── Commit everything ─────────────────────────────────────────────────
        db.commit()

        print("=" * 60)
        print("[Seed] ✅  Database seeded successfully!")
        print(f"       Projects      : {db.query(Project).count()}")
        print(f"       Users         : {db.query(User).count()}")
        print(f"       Leads         : {db.query(Lead).count()}")
        print(f"       Site Visits   : {db.query(SiteVisit).count()}")
        print(f"       Fact Sheets   : {db.query(FactSheet).count()}")
        print("=" * 60)

    except Exception as exc:
        db.rollback()
        print(f"[Seed] ❌  Error — rolled back. Details: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

