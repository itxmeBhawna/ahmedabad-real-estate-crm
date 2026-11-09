# Ahmedabad Real Estate CRM

> End-to-end Real Estate Lead Management & AI Visit Booking Web App  
> Built for the Ahmedabad property market with DPDP Act 2023 & Gujarat RERA compliance.

---

## Complete Multi-Phase Architecture

```
ahmedabad-real-estate-crm/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # App settings, JWT parameters, slot hours
│   │   │   ├── security.py           # Passlib bcrypt hashing & JWT token encode/decode
│   │   │   └── dependencies.py       # DB session, auth & RBAC guards (buyer/exec/head)
│   │   ├── models/                   # SQLAlchemy 2.0 ORM models (one per file)
│   │   │   ├── user.py               # User (buyer / sales_executive / sales_head)
│   │   │   ├── project.py            # Real-estate project with RERA details
│   │   │   ├── lead.py               # Prospect lead (DPDP-masked phone)
│   │   │   ├── fact_sheet.py         # Grounded knowledge base for AI chatbot
│   │   │   └── site_visit.py         # Booked / completed visits
│   │   ├── schemas/                  # Pydantic v2 validation schemas
│   │   │   ├── auth.py               # Login credentials & token responses
│   │   │   ├── project.py            # Project details output schema
│   │   │   ├── lead.py               # Lead create, update & duplicate checks
│   │   │   ├── chat.py               # AI chat request, response & guardrail payloads
│   │   │   ├── fact_sheet.py         # Admin knowledge base CRUD schemas
│   │   │   └── visit.py              # Slot queries, conflict checks & booking schemas
│   │   ├── services/
│   │   │   ├── ai_service.py         # Multilingual fact-sheet grounding & pricing guardrails
│   │   │   └── booking_service.py    # Conflict-free site-visit slot manager (IST working hours)
│   │   ├── routers/                  # FastAPI endpoint modules
│   │   │   ├── auth.py               # POST /api/auth/login, GET /api/auth/me, GET /executives
│   │   │   ├── projects.py           # GET /api/projects
│   │   │   ├── leads.py              # GET /api/leads, POST /api/leads, GET /check-duplicate
│   │   │   ├── chat.py               # POST /api/chat (multilingual fact-sheet grounded)
│   │   │   ├── fact_sheets.py        # GET, POST, PUT, DELETE /api/fact-sheets (Admin)
│   │   │   ├── visits.py             # GET /api/visits/slots, POST /book-public, PATCH /{id}
│   │   │   └── analytics.py          # Pipeline KPIs, source breakdown, conversion funnel
│   │   ├── database.py               # Engine, sessionmaker, Base, DB_ENGINE toggle
│   │   ├── seed.py                   # Idempotent Ahmedabad sample data seeder
│   │   └── main.py                   # FastAPI application, CORS & route mounting
│   ├── requirements.txt
│   ├── verify_phase2.py              # Automated API verification test suite (Phase 2)
│   ├── verify_phase4.py              # Automated Admin & Handoff test suite (Phase 4)
│   └── .env.example
│
├── frontend/                         # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Luxury branding, RERA badges & role navigation
│   │   │   ├── ProjectShowcase.jsx   # RERA project cards (Shivalik Grand, Aavkar Residency)
│   │   │   ├── ChatWidget.jsx        # Multilingual AI chat with pricing guardrails
│   │   │   ├── VisitBookingModal.jsx # Interactive conflict-free slot booking modal
│   │   │   └── LeadHandoffModal.jsx  # AI-generated 1-paragraph briefing & intent modal
│   │   ├── pages/
│   │   │   ├── BuyerPortal.jsx       # Public luxury real estate buyer experience
│   │   │   ├── LoginPage.jsx         # Minimalist login UI with 1-click demo role logins
│   │   │   ├── ExecutiveDashboard.jsx# Sales Lead CRM dashboard with status & filters
│   │   │   └── AdminPanel.jsx        # Sales Head panel (Fact Sheets, Slots, Analytics)
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global JWT authentication & role management
│   │   ├── services/
│   │   │   └── api.js                # Unified client for all backend endpoints
│   │   ├── App.jsx                   # Role-based hash routing (#login, #dashboard, #admin)
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js                # Reverse proxy to http://127.0.0.1:8000
│   └── tailwind.config.js            # Luxury gold (#c59b4c) & deep slate palette
└── README.md
```

---

## Role-Based Credentials (Seeded)

| Role | Name | Email | Password | Landing View |
|---|---|---|---|---|
| **Sales Head (Admin)** | Amit Desai | `amit.desai@realty.in` | `HeadPass@2025` | `#admin` |
| **Sales Executive** | Rahul Chouhan | `rahul.chouhan@realty.in` | `Exec@2025!` | `#dashboard` |
| **Sales Executive** | Priya Mehta | `priya.mehta@realty.in` | `Exec@2025!` | `#dashboard` |
| **Prospective Buyer** | (Public) | — | — | Public `#` (or `#buyer`) |

---

## Quick Start Guide

### 1. Backend Server (FastAPI)

```bash
cd backend

# Create & activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment config
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Create database tables & seed sample data
python -m app.database
python -m app.seed

# Verify all Phase 4 endpoints
python verify_phase4.py

# Start dev server
uvicorn app.main:app --reload --port 8000
```
- **Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

### 2. Frontend Application (React + Vite)

```bash
cd frontend

# Install dependencies (already built in production)
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Key Modules by User Journey

### 1. Buyer Journey (`/` or `/#buyer`):
- **Multilingual Property AI Assistant:** Toggle between English, हिन्दी, and ગુજરાતી.
- **RERA Fact-Sheet Grounding:** Verifies pricing, amenities, carpet area, possession, and metro distance.
- **Hard Pricing Guardrails:** Disallows unapproved quotes; offers instant callback request.
- **Conflict-Free Visit Booking:** Real-time slot grid (Mon–Sat, 10 AM – 5 PM IST); Sunday closures; DPDP-compliant masked phone storage.

### 2. Sales Executive Journey (`/#dashboard`):
- **Executive Lead Dashboard:** Data-dense table of all assigned leads with acquisition channel badges (`portal`, `social_ad`, `hoarding`).
- **Inline Status Updates:** Move leads across `New` ➔ `Contacted` ➔ `Visit Booked` ➔ `Visited`.
- **AI Chat Handoff Briefing Modal:** One-click executive view displaying buyer intent, target budget, and a concise 1-paragraph summary synthesized from their chat history for high-conversion discovery calls.

### 3. Sales Head Admin Journey (`/#admin`):
- **Knowledge Base & FAQ Editor:** Add, edit, or delete entries in the `fact_sheet` table to instantly update the AI assistant's grounded answers.
- **Site Visit Operations:** View and manage appointments across all sales executives.
- **Pipeline & Conversion Analytics:** KPI overview, acquisition channel distribution, and conversion funnel stats.
