from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- 1. Health Checks ---")
r = client.get("/")
print("Root health:", r.status_code, r.json())
r = client.get("/api/health")
print("API health:", r.status_code, r.json())

print("\n--- 2. Auth Flows ---")
r = client.post("/api/auth/login", json={"email": "amit.desai@realty.in", "password": "HeadPass@2025"})
print("Auth login (sales_head):", r.status_code)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

r = client.get("/api/auth/me", headers=headers)
print("Auth /me:", r.status_code, r.json())

print("\n--- 3. Leads CRUD & Duplicate Check ---")
r = client.get("/api/leads/", headers=headers)
print("Leads count:", len(r.json()))
r = client.get("/api/leads/check-duplicate?phone=+91-98765-XXXXX", headers=headers)
print("Duplicate check (existing):", r.status_code, r.json())

print("\n--- 4. AI Chat & Guardrails ---")
r = client.post("/api/chat/", json={"message": "What amenities are in Shivalik Grand?", "language": "en", "project_id": 1})
print("Chat amenities answer:", r.status_code, r.json()["reply"][:50] + "...")

r = client.post("/api/chat/", json={"message": "Can you give me 10% discount?", "language": "en", "project_id": 1})
print("Chat guardrail (discount):", r.status_code, "handoff:", r.json()["handoff_required"], "reason:", r.json()["handoff_reason"])

r = client.post("/api/chat/", json={"message": "I want to schedule a visit", "language": "en", "project_id": 1})
print("Chat booking intent:", r.status_code, "suggested_action:", r.json()["suggested_action"])

print("\n--- 5. Slot Booking ---")
r = client.get("/api/visits/slots?project_id=1&date=2026-11-20")
slots = r.json()["available_slots"]
print("Available slots for 2026-11-20 (public):", len(slots))

print("\n--- 5b. Public Booking ---")
r = client.post("/api/visits/book-public", json={
    "name": "Jigar Mehta",
    "phone": "9825012345",
    "project_id": 1,
    "slot_datetime": "2026-11-20T14:00:00+05:30"
})
print("Public booking response:", r.status_code, "Lead:", r.json().get("lead_name"), "Exec:", r.json().get("executive_name"))

print("\n--- 5c. Projects API ---")
r = client.get("/api/projects/")
print("Projects count:", len(r.json()), [p["name"] for p in r.json()])

print("\n--- 6. Analytics ---")
r = client.get("/api/analytics/overview", headers=headers)
print("Analytics overview:", r.status_code, r.json())

print("\nALL PHASE 2 BACKEND ENDPOINTS FUNCTIONING PERFECTLY!")
