# CareChrono Setup & Execution Guide

## Quick Start (Zero Config)

### 1. Backend Setup & Run
```bash
# Navigate to project root
# Activate or invoke Python 3.11
python -m pip install -r backend/requirements.txt

# Run seed script (creates SQLite carechrono.db and pre-populates realistic clinical demo data)
python -m backend.seed

# Start FastAPI backend server (runs on http://localhost:8000)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup & Run
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies (React 18, Vite, Recharts, Tailwind CSS, Lucide Icons)
npm install

# Start Vite development server
npm run dev
# App will open at http://localhost:5173 (or http://127.0.0.1:5173)
```

---

## Seeded Demo Accounts (1-Click Switchable)
You can instantly toggle roles using the **Role Switcher** in the top navigation bar or log in manually:

1. **Patient**: `patient@carechrono.com` / `Patient123!`
   - Arthur Pendelton, 68
   - Chronic Conditions: Type 2 Diabetes, Hypertension, Coronary Artery Disease
   - Has 14 days of logged vitals, 4 active medications, 2 consultations, and Health Bloom flower.

2. **Doctor**: `doctor@carechrono.com` / `Doctor123!`
   - Dr. Richard Chen, MD
   - Cardiology & Chronic Care Specialist
   - Can calibrate, adjust, and approve clinician alert thresholds.

3. **Caregiver**: `caregiver@carechrono.com` / `Caregiver123!`
   - Kelly Johnson (Arthur's daughter)
   - Designated primary emergency contact with consented access.

4. **Senior Mode**:
   - Tap the **Senior Mode** pill in the top header.
   - Instantly switches to flat, high-contrast, large-button accessible UI.

---

## Production / Supabase PostgreSQL Connection
To connect to Supabase or any PostgreSQL database:
1. Copy `.env.example` to `backend/.env`.
2. Set `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Run `python -m backend.seed` to populate PostgreSQL tables.
