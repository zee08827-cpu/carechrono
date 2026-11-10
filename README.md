# CARECHRONO — Beyond Medical Storage

> **A Patient-Centred Web Platform for Chronic Disease Management**  
> Tailored for patients navigating Type 2 Diabetes, Hypertension, and Cardiovascular conditions and Many other Chronic Diseases

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-teal)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.15-sky)](https://tailwindcss.com)
[![WCAG_AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🎯 The Problem CareChrono Solves
Chronic patients frequently switch specialists and accumulate fragmented files across clinics and portals. Existing storage solutions act as static digital filing cabinets — they don't help patients understand what actually changed between visits, whether therapy is working, or when attention is genuinely needed.

**CareChrono goes beyond storage:**
1. **Unified Health Records**: Clean folder-style cards organizing labs, notes, imaging, and prescriptions.
2. **Consultation Comparison ("What Changed Between Visits")**: Automatic diff engine highlighting medication changes, clinical vitals shifts (BP, fasting blood sugar, HbA1c), and lifestyle guidance.
3. **Continuous Monitoring with Trend Charts**: Interactive Recharts timelines with **dashed clinician-target lines**, sparkline rows, and in-range indicators.
4. **Medication Reminders + Guidance**: Regimens grouped by time of day, intake rules (e.g. food requirements), and refill countdowns.
5. **Smart Alerts from Clinician-Approved Thresholds**: Certified boundaries calibrated by attending physicians; non-diagnostic phrasing ("attention may be needed") strictly adhered to.
6. **Senior Mode with Caregiver Alerts**: Flat, high-contrast UI (min 22px text, 4 full-width buttons), and 1-tap emergency caregiver notification with revocable patient consent.
7. **Health Bloom Motivation**: Friendly SVG flower that blooms petal-by-petal as daily health targets are met (replaces clinical body maps with motivational positivity).

---

## 🎨 Design System & Palette (Miami Nights Reference)
- **Deep Teal** `#0F4953`: Primary text, dark hero card, primary buttons.
- **Mint** `#CBF5EF`: Card tints, chart fills, "improved" state badges.
- **Off-White** `#F9FCFB`: Page background canvas.
- **Coral** `#F98E6E`: Warning accents (fills & icons only; always paired with high-contrast text and icons).
- **Soft Pink** `#FFCFD2`: Gentle highlights, empty states, bloom petals.
- **Critical Alert Coral** `#C2410C`: Distinguishes urgent alerts from warnings.
- **Typography & Components**: Plus Jakarta Sans, radius 24px cards, pill chips/buttons, floating pill bottom nav.

---

## 🚀 Quick Start

### Backend (FastAPI + SQLAlchemy)
```bash
# In Carechrono root:
python -m pip install -r backend/requirements.txt
python -m backend.seed
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React + Vite + Tailwind + Recharts)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** to experience the app.

---

## 👥 Demo Personas (1-Click Switchable)
- **Arthur Pendelton (Patient)**: 68-year-old managing Type 2 Diabetes and Hypertension.
- **Dr. Richard Chen, MD (Doctor)**: Attending cardiologist; approves thresholds and writes consultation diffs.
- **Kelly Johnson (Caregiver)**: Arthur's daughter with active, patient-consented monitoring access.
- **Senior Mode**: Click the "Senior Mode" pill in the header for the flat, large-button, high-contrast UI.

---

## 🛡️ Safety & Governance
CareChrono is strictly assistive and never provides clinical diagnoses. All views feature a persistent medical governance disclaimer footer. Caregiver data access requires explicit, revocable patient consent at all times.
