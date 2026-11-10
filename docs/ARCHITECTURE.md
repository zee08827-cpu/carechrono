# CareChrono Architecture & Design System

## Overview
**CareChrono** is a patient-centred digital health platform engineered specifically for people managing chronic conditions (Type 2 Diabetes, Hypertension, Coronary Artery Disease). 

While existing medical storage apps simply act as static digital filing cabinets, CareChrono **goes beyond storage** to help patients and caregivers truly understand change over time.

---

## The 6 Core Pillars

```
+-------------------------------------------------------------------------+
|                               CareChrono                                |
+-------------------+--------------------+--------------------------------+
| 1. Unified Health | 2. Consultation    | 3. Continuous Monitoring       |
|    Records        |    Comparison      |    & Trend Charts              |
| (Folder-style)    | (What Changed)     | (Recharts + Clinician Targets) |
+-------------------+--------------------+--------------------------------+
| 4. Medication     | 5. Clinician       | 6. Senior Mode &               |
|    Reminders &    |    Approved Alerts |    Caregiver Delegation        |
|    Health Bloom   | ("Attention        | (Explicit Consent, 1-Tap Call) |
|    Motivation     |   may be needed")  |                                |
+-------------------+--------------------+--------------------------------+
```

1. **Unified Health Records**: Clean folder-style cards organizing labs, consultation summaries, imaging (ECG), and prescriptions.
2. **Consultation Comparison ("What Changed Between Visits")**: Diff engine computing medication changes (new, adjusted, discontinued), vital shifts (BP, glucose, HbA1c, heart rate), clinical plan updates, and doctor notes.
3. **Continuous Monitoring with Trend Charts**: 14-day interactive timelines with Recharts, sparkline rows, and dashed clinician target lines.
4. **Medication Reminders & Guidance**: Daily schedules grouped by time of day, food-intake guidelines, refill countdowns, and the motivational **Health Bloom** SVG flower.
5. **Smart Alerts from Clinician-Approved Thresholds**: Assistive safety monitoring with doctor-certified boundaries. Non-diagnostic phrasing strictly adhered to ("attention may be needed").
6. **Senior Mode with Caregiver Alerts**: Accessible flat interface with 4 large full-width buttons, minimum 22px text, maximum contrast deep teal on off-white, and 1-tap caregiver notification.

---

## Technology Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL (Supabase ready) / SQLite zero-config local engine.
- **Frontend**: React 18 (Vite), Tailwind CSS, Recharts, Lucide Icons.
- **Authentication**: JWT Bearer Tokens with Role-Based Access Control (`patient`, `caregiver`, `doctor`).
- **Design Tokens (Miami Nights Palette)**:
  - Deep Teal `#0F4953`: Primary text, dark hero card, primary buttons.
  - Mint `#CBF5EF`: Card tints, chart fills, "improved" status badges.
  - Off-White `#F9FCFB`: Page canvas background.
  - Coral `#F98E6E`: Warning accents (fills & icons only, WCAG AA compliant).
  - Soft Pink `#FFCFD2`: Gentle highlights, empty states, Health Bloom petals.
  - Critical Coral `#C2410C`: High-priority critical attention alerts.
