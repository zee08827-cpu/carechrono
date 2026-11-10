# Clinical Safety & Governance Principles

CareChrono adheres to strict clinical safety guardrails, patient privacy principles, and accessibility standards.

---

## 1. Safety Rule: Assistive Only, Never Diagnostic
- **Non-Diagnostic Rule**: The software **never diagnoses**.
- **Alert Phrasing**: All smart alerts are strictly phrased as `"attention may be needed"`, never assigning diagnostic labels (e.g. "Attention may be needed: Systolic blood pressure reading is above your clinician target", rather than "Hypertensive crisis").
- **Universal Footer**: Displayed on every view:
  > *"CareChrono is an assistive tracking tool and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider with any questions."*
- **Health Bloom Disclaimer**: The motivational flower illustration includes an explicit notice: *"Motivational visual only — not a clinical diagnosis or treatment assessment."*

---

## 2. Clinician-Approved Thresholds
- **Doctor Authority**: Alert boundaries are not arbitrary algorithmic guesses. They are defined and certified by licensed clinicians (`doctor` role), with conservative, evidence-based safe defaults pre-loaded (e.g., Systolic target < 130 mmHg, Fasting Glucose 80-125 mg/dL).
- **Auditability**: Every threshold record stores `approved_by_name`, `doctor_id`, and `clinical_rationale`.

---

## 3. Explicit & Revocable Caregiver Access
- **Patient Sovereignty**: Caregiver access is never automatic. It requires affirmative, explicit patient consent.
- **Unilateral Revocation**: The patient can revoke caregiver access at any moment with 1 click. Access terminates immediately with timestamp auditing.

---

## 4. Accessibility & Senior Mode (WCAG 2.1 AA)
- **Contrast Ratios**: All text meets or exceeds WCAG AA standards (4.5:1 for normal text, 7:1 for high contrast).
- **Form Accessibility**: Every input field possesses an explicit `<label htmlFor="...">` attribute.
- **Multi-Modal Signals**: Color is never used as the sole indicator. Statuses always combine color with an icon and a textual label (`Improved [Down Arrow]`, `Needs Attention [Alert Icon]`).
- **Senior Mode Standards**:
  - Flat design: No glassmorphism, blur, or transparency distractions.
  - 4 large full-width buttons with minimum 64px touch targets.
  - Minimum 22px text.
  - Maximum contrast (Deep Teal `#0F4953` on Off-white `#F9FCFB`).
