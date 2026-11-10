# CareChrono API Specification

The CareChrono backend exposes RESTful endpoints with JWT bearer authentication and role verification (`patient`, `caregiver`, `doctor`).

Base URL: `http://localhost:8000`

---

## 1. Authentication & Roles
- `POST /api/auth/register` — Create account (`email`, `password`, `full_name`, `role`, `conditions`, `is_senior_mode`).
- `POST /api/auth/login` — Authenticate and receive JWT access token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/demo-switch/{role}` — Instant demo role switcher (`patient`, `caregiver`, `doctor`) for evaluation.
- `POST /api/auth/toggle-senior-mode` — Toggle user's senior mode flag.

---

## 2. Consultations & Change Diff Engine
- `GET /api/consultations` — List chronological clinical visits.
- `GET /api/consultations/{id}` — Get single consultation detail.
- `GET /api/consultations/compare?c1_id={id}&c2_id={id}` — **Core Differentiator**: Computes full diff between two doctor encounters:
  - Medication adjustments (new, adjusted, continued, discontinued).
  - Vitals shifts with directional arrows and semantic status (`improved`, `needs_attention`, `stable`).
  - Clinical assessment & lifestyle advice comparison.
  - Days between visits & overall patient takeaway.

---

## 3. Continuous Monitoring & Vitals
- `POST /api/vitals` — Log vital reading (Systolic, Diastolic, Blood Glucose, Heart Rate, Weight). Evaluates against clinician thresholds and creates non-diagnostic alerts if needed.
- `GET /api/vitals/trends` — Returns 14-day aggregated sparkline series, clinician target lines, and status indicators for Recharts visualization.
- `GET /api/vitals/history` — Paginated raw measurement history.

---

## 4. Medications & Health Bloom
- `GET /api/medications` — Active medication schedules with today's taken status.
- `POST /api/medications/log-adherence` — Mark dose taken/missed.
- `GET /api/medications/bloom-status` — Returns petals earned (0-5), bloom stage (`seed`, `budding`, `half_bloom`, `full_bloom`), and motivational status.

---

## 5. Clinician Thresholds & Smart Alerts
- `GET /api/thresholds` — View clinician-approved boundaries.
- `PUT /api/thresholds/{id}` — (Doctor only) Calibrate target min/max, warning levels, critical levels, and clinical rationale.
- `GET /api/alerts` — Active smart alerts for patient.
- `POST /api/alerts/{id}/acknowledge` — Mark alert acknowledged.
- `POST /api/alerts/senior-emergency` — Trigger 1-tap caregiver emergency call from Senior Mode.

---

## 6. Caregiver Consent & Delegation
- `GET /api/caregivers/consents` — List active/revoked caregiver permissions.
- `POST /api/caregivers/grant` — Patient grants explicit access to caregiver email.
- `POST /api/caregivers/{id}/revoke` — Patient unilaterally revokes caregiver access immediately.
- `GET /api/caregivers/patients` — List patients consented to this caregiver.

---

## 7. Unified Health Records
- `GET /api/records` — Fetch folder records (filter by `category=lab|consultation|prescription|imaging`).
- `POST /api/records` — Upload or register new clinical record card.
- `GET /api/records/{id}` — Detailed report metadata and clinical findings.
