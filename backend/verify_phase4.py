from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- 1. Login as Sales Head (Admin) ---")
r = client.post("/api/auth/login", json={"email": "amit.desai@realty.in", "password": "HeadPass@2025"})
assert r.status_code == 200, f"Login failed: {r.text}"
admin_token = r.json()["access_token"]
admin_hdrs = {"Authorization": f"Bearer {admin_token}"}
print("Admin token obtained.")

print("\n--- 2. Login as Sales Executive ---")
r = client.post("/api/auth/login", json={"email": "rahul.chouhan@realty.in", "password": "Exec@2025!"})
assert r.status_code == 200, f"Exec login failed: {r.text}"
exec_token = r.json()["access_token"]
exec_hdrs = {"Authorization": f"Bearer {exec_token}"}
print("Exec token obtained.")

print("\n--- 3. List Executives Endpoint ---")
r = client.get("/api/auth/executives", headers=admin_hdrs)
assert r.status_code == 200
execs = r.json()
print("Executives count:", len(execs), [e["name"] for e in execs])

print("\n--- 4. Fact Sheet Management (Admin) ---")
# List fact sheets
r = client.get("/api/fact-sheets/", headers=admin_hdrs)
assert r.status_code == 200
print("Initial fact sheets count:", len(r.json()))

# Create new fact sheet
new_fs_payload = {
    "project_id": 1,
    "category": "Possession",
    "question": "What is the expected possession timeline for Shivalik Grand Phase 1?",
    "answer": "Shivalik Grand Phase 1 towers are scheduled for handover starting June 2026."
}
r = client.post("/api/fact-sheets/", json=new_fs_payload, headers=admin_hdrs)
assert r.status_code == 201, f"Create FS failed: {r.text}"
created_fs = r.json()
fs_id = created_fs["id"]
print(f"Created Fact Sheet ID {fs_id}:", created_fs["question"][:40], "...")

# Update fact sheet
r = client.put(f"/api/fact-sheets/{fs_id}", json={
    "answer": "Updated: Handover confirmed for June 2026 under Gujarat RERA schedule."
}, headers=admin_hdrs)
assert r.status_code == 200
print("Updated Fact Sheet ID", fs_id)

# Delete fact sheet
r = client.delete(f"/api/fact-sheets/{fs_id}", headers=admin_hdrs)
assert r.status_code == 204
print("Deleted Fact Sheet ID", fs_id)

print("\n--- 5. Leads List with AI Briefing Synthesis ---")
r = client.get("/api/leads/", headers=admin_hdrs)
assert r.status_code == 200
leads = r.json()
print("Leads count:", len(leads))
sample_lead = leads[0]
print("Sample Lead:", sample_lead["name"], "| Status:", sample_lead["status"], "| Budget:", sample_lead["budget"])
print("Sample AI Briefing:\n ", sample_lead["ai_summary"][:120], "...")

print("\n--- 6. Site Visits List (Admin / Exec) ---")
r = client.get("/api/visits/", headers=admin_hdrs)
assert r.status_code == 200
visits = r.json()
print("Total booked visits count:", len(visits))

print("\n--- 7. Pipeline Analytics ---")
r = client.get("/api/analytics/overview", headers=admin_hdrs)
assert r.status_code == 200
print("Overview KPIs:", r.json())

r = client.get("/api/analytics/lead-sources", headers=admin_hdrs)
assert r.status_code == 200
print("Lead sources breakdown:", r.json())

r = client.get("/api/analytics/conversion-funnel", headers=admin_hdrs)
assert r.status_code == 200
print("Conversion funnel stages:", [f"{s['stage']}: {s['count']}" for s in r.json()])

print("\n========================================================")
print("✅ ALL PHASE 4 BACKEND & ADMIN ENDPOINTS FULLY VERIFIED!")
print("========================================================")

