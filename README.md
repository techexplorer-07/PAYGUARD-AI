# PAYGUARD AI

**Intent-Aware Real-Time Financial Scam Prevention and Payment Intervention System**

*Prototype for Visionet Talent Quest 2026 – Techthon*

---

## 1. Project Overview

PAYGUARD AI is an advanced fintech scam prevention prototype designed to detect and disrupt financial fraud—particularly **Authorized Push Payment (APP) scams**, **impersonation fraud**, and **social engineering coercion**—before funds are irreversibly transferred.

Unlike conventional fraud systems that rely solely on static transactional rules (such as amount thresholds or geography), PAYGUARD AI analyzes the **underlying intent and psychological coercion cues** accompanying a payment request. When elevated scam probabilities are detected, the system dynamically injects calibrated **cognitive interventions** (cooling-off periods, clarifying queries, and interactive friction challenges) to break the scammer's psychological grip on the victim.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Tooling:** Vite
- **Styling:** Tailwind CSS (v4)
- **Linter:** Oxlint
- **Code Standards:** TypeScript Strict Mode (`strict: true`, `verbatimModuleSyntax: true`)

### Backend
- **Runtime:** Python 3.12+ (tested and verified on Python 3.13)
- **Framework:** FastAPI
- **Data Validation & Settings:** Pydantic v2 & Pydantic-Settings
- **Server:** Uvicorn ASGI
- **Testing:** Pytest + HTTPX

---

## 3. Current Implementation Status

**Phase 1: Project Architecture, Environment Setup & Application Foundation** is complete.

**Phase 2.1: Intent-to-Payment Correlation Engine** is implemented and verified.

- [x] Environment inspection and toolchain verification.
- [x] Standardized repository layout established (`frontend/`, `backend/`, `docs/`, `data/`).
- [x] React + TypeScript + Vite frontend configured with Tailwind CSS.
- [x] Branded PAYGUARD AI application shell and landing page with live backend health monitor.
- [x] FastAPI backend with structured configuration (`core/config.py`) and CORS middleware.
- [x] Diagnostic health check endpoints (`GET /health` and `GET /api/v1/health`).
- [x] **Intent-to-Payment Correlation Engine** (`POST /api/v1/correlation/analyze`) with deterministic Context Intelligence extraction, recipient diversion detection, and explainable rule-based risk scoring.
- [x] Pytest suite with 15 automated integration and scenario tests passing.
- [x] Complete environment templates (`.env.example`, `frontend/.env.example`) and comprehensive `.gitignore`.
- [x] Technical architecture (`docs/ARCHITECTURE.md`), development roadmap (`docs/DEVELOPMENT_PLAN.md`), audit report (`docs/reports/PHASE1_AUDIT_REPORT.md`), and engine documentation (`docs/PHASE2_1_INTENT_PAYMENT_ENGINE.md`).

> [!IMPORTANT]
> **Implementation Boundaries:**
> - Database connections (PostgreSQL) and live payment network integrations will be introduced in subsequent phases per the development plan.
> - **PAYGUARD 2.0 has NOT been implemented.** Proposed innovations (evidence graphs, Android floating assistant, multilingual code-mixed NLP) are planned for future phases.

---

## 4. Prerequisites

Ensure the following runtimes are installed on your workstation:

- **Node.js:** v18.0.0 or later (v26.x confirmed)
- **npm:** v9.0.0 or later (v12.x confirmed)
- **Python:** v3.12 or v3.13 (Python 3.13 confirmed)
- **Git:** v2.x or later

---

## 5. Installation & Setup Instructions

### 5.1 Clone & Environment Setup

```bash
# Clone the private repository
git clone <repository-url>
cd "PAYGUARD AI"

# Copy the environment template to create your local .env file
# Windows (PowerShell):
Copy-Item .env.example .env
# Windows (CMD):
copy .env.example .env
# Linux / macOS:
cp .env.example .env
```

*(Optional: For frontend-specific development, you can also copy `frontend/.env.example` to `frontend/.env`)*

### 5.2 Backend Installation

Create and activate the Python virtual environment inside `backend/`, then install dependencies:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment inside backend/
python -m venv venv

# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### 5.3 Frontend Installation

From the project root:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (or use `npm ci` for exact locked versions)
npm install
```

---

## 6. Running the Applications

### 6.1 Starting the Backend Server

> [!NOTE]
> Make sure your working directory is `backend/` (with your virtual environment activated) so Python resolves `app.main`:

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **API Base:** `http://127.0.0.1:8000`
- **Health Check:** `http://127.0.0.1:8000/health`
- **Intent Correlation API:** `POST http://127.0.0.1:8000/api/v1/correlation/analyze`
- **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`

Expected `/health` response:
```json
{
  "status": "ok",
  "service": "payguard-api"
}
```

### 6.2 Starting the Frontend Development Server

From the `frontend` directory:

```bash
cd frontend
npm run dev
```

The frontend will run locally at:
- `http://localhost:5173`

The landing page features a **System Diagnostics** widget that will automatically probe the backend at `http://127.0.0.1:8000/health` and display a live connection status badge.

---

## 7. Testing and Build Verification

### 7.1 Running Backend Tests

From the `backend` directory with the virtual environment activated:

```bash
cd backend
pytest -v
```

All health check tests (`tests/test_health.py`) will execute against the FastAPI ASGI transport without requiring an external server process.

### 7.2 Frontend Linting & Production Build

From the `frontend` directory:

```bash
cd frontend

# Run Oxlint static analysis
npm run lint

# Compile TypeScript and bundle production assets
npm run build
```

The build compiles TypeScript in strict mode and bundles static distribution assets into `frontend/dist/`.

---

## 8. Project Structure

```
PAYGUARD-AI/
├── frontend/                     # React + TypeScript + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/           # Presentational components (Navbar, Footer)
│   │   ├── layouts/              # Structural layouts (MainLayout)
│   │   ├── pages/                # Route views (LandingPage with Health Monitor)
│   │   ├── services/             # Typed API client (api.ts)
│   │   ├── types/                # TypeScript interfaces (index.ts)
│   │   ├── App.tsx               # Main application shell
│   │   ├── main.tsx              # Application entry point
│   │   └── index.css             # Tailwind CSS imports
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example              # Frontend environment template
│   └── vite.config.ts
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # Application factory, CORS & exception handling
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── health.py     # GET /health & GET /api/v1/health endpoints
│   │   └── core/
│   │       ├── __init__.py
│   │       └── config.py         # Pydantic Settings & CORS configuration
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py        # Automated Pytest suite
│   ├── requirements.txt          # Pinned Python package dependencies
│   └── venv/                     # Python virtual environment (git-ignored)
├── docs/                         # Technical documentation
│   ├── ARCHITECTURE.md           # System and component architecture
│   ├── DEVELOPMENT_PLAN.md       # Roadmap for upcoming phases
│   └── reports/
│       └── PHASE1_AUDIT_REPORT.md# Comprehensive Phase 1 audit report
├── data/
│   └── synthetic/
│       └── README.md             # Synthetic data policy
├── .gitignore                    # Comprehensive Git exclusion rules
├── .env.example                  # Root environment configuration template
└── README.md                     # Project overview and setup guide
```

---

## 9. Engineering Governance & Guidelines

- **Synthetic Data Exclusivity:** No real banking, PII, or live financial accounts are used. Synthetic datasets only.
- **Strict Typing:** Python type hints and TypeScript strict mode are enforced across all layers.
- **Zero Fabrication:** No mock AI functionality, fabricated accuracy metrics, or premature production claims.
- **Security by Default:** No secrets or credentials in source control; CORS whitelisting restricted to local origins.
