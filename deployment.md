
```markdown
# Deployment & Local Execution Guide
**Project:** Ahmedabad Real Estate Lead Management & AI Visit Booking Web App (Brief 3)
**GitHub Repository:** https://github.com/itxmeBhawna/ahmedabad-real-estate-crm

---

## 1. How to Run Locally (Step-by-Step)

Prerequisites: Python 3.11+, Node.js (v18+), and npm installed.

### Step 1: Clone the Repository & Navigate to Project Root
```bash
git clone [https://github.com/itxmeBhavna/ahmedabad-real-estate-crm.git](https://github.com/itxmeBhavna/ahmedabad-real-estate-crm.git)
cd ahmedabad-real-estate-crm

```

### Step 2: Set Up and Run the Backend

1. Navigate to the backend folder and create a Python virtual environment:
```bash
cd backend
python -m venv .venv

```


2. Activate the virtual environment:
* **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
* **Mac/Linux:** `source .venv/bin/activate`


3. Install the required Python dependencies:
```bash
pip install -r requirements.txt

```


4. Set up your environment file:
Copy `.env.example` to `.env`.
5. Initialize the database and run the seed script:
```bash
python -m app.seed

```


6. Start the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000

```


*(The backend API will be live at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`).*

### Step 3: Set Up and Run the Frontend

1. Open a new terminal window and navigate to the frontend folder:
```bash
cd frontend

```


2. Install Node dependencies:
```bash
npm install

```


3. Start the Vite development server:
```bash
npm run dev

```


*(Open your browser at `http://localhost:5173` to view the application).*

---

## 2. Environment Variables Required (Names Only)

The application reads the following configuration variables via a `.env` file in the backend root. (No secret or sensitive values are committed to the repository).

* `DB_ENGINE` *(Defines database backend choice, e.g., sqlite or mysql)*
* `DATABASE_URL` *(Connection string for the active database)*
* `JWT_SECRET_KEY` *(Secret key used for signing and verifying JWT tokens)*
* `ALGORITHM` *(Cryptographic algorithm for JWT tokens, e.g., HS256)*
* `ACCESS_TOKEN_EXPIRE_MINUTES` *(Token lifespan duration)*

---

## 3. Demo Login Details for Reviewers

To test the role-based dashboards without creating a new account, use the following pre-seeded credentials:

### 👑 Sales Head (Admin Console Access)

* **Email:** `amit.desai@realty.in`


* **Password:** `HeadPass@2025`
* **Access Route:** `/#admin` (Manages knowledge base fact sheets, team schedules, and pipeline analytics)

### 🧑‍💼 Sales Executive (Lead Dashboard Access)

* **Email:** `rahul.chouhan@realty.in`


* **Password:** `Exec@2025!`
* **Access Route:** `/#dashboard` (Manages assigned buyer leads and AI handoff briefs)

### 🏡 Buyer Role

* Access the public portal directly at `http://localhost:5173` to test the multilingual AI chat assistant and conflict-free site visit scheduler.

```
