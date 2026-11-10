"""
CareChrono - Patient Targets & Alert Rules Route
Patients own their data and care plan targets.
Supports:
- General guidelines labelled 'General guideline, not personalised'
- Doctor-prescribed targets entered by the patient with doctor name & date
- Fixed non-editable safety floors: BP >= 180/120 mmHg, Glucose < 70 or > 250 mg/dL
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AlertRule
from ..schemas import AlertRuleOut, AlertRuleUpdate
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/targets", tags=["My Targets"])

# Non-editable fixed safety floors
FIXED_SAFETY_FLOORS = {
    "blood_pressure": {
        "critical_systolic_max": 180.0,
        "critical_diastolic_max": 120.0,
        "label": "BP >= 180/120 mmHg (Hypertensive Urgency Safety Floor - Fixed & Non-editable)"
    },
    "blood_glucose": {
        "critical_min": 70.0,
        "critical_max": 250.0,
        "label": "Glucose < 70 or > 250 mg/dL (Severe Hypo/Hyperglycemia Safety Floor - Fixed & Non-editable)"
    }
}

@router.get("/safety-floors")
def get_safety_floors():
    """Returns the non-editable safety floors enforced on all accounts."""
    return {
        "safety_floors": FIXED_SAFETY_FLOORS,
        "description": "These critical boundaries are hardcoded safety floors that cannot be altered, loosened, or disabled."
    }

@router.get("", response_model=List[AlertRuleOut])
def get_targets(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access targets")

    rules = db.query(AlertRule).filter(
        (AlertRule.patient_id == target_patient_id) | (AlertRule.patient_id.is_(None))
    ).all()

    return rules

@router.put("/{rule_id}", response_model=AlertRuleOut)
def update_target(
    rule_id: int,
    payload: AlertRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient enters or updates their target from their own doctor.
    Enforces that fixed safety floors cannot be disabled or loosened.
    """
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Target rule not found")

    if rule.patient_id and rule.patient_id != current_user.id and current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Not authorized to modify this target")

    if rule.patient_id is None:
        rule.patient_id = current_user.id

    if payload.target_min is not None:
        rule.target_min = payload.target_min
    if payload.target_max is not None:
        rule.target_max = payload.target_max
    if payload.warning_min is not None:
        rule.warning_min = payload.warning_min
    if payload.warning_max is not None:
        rule.warning_max = payload.warning_max

    # Enforce non-editable safety floors
    if rule.metric_type == "blood_pressure":
        rule.critical_max = min(payload.critical_max or 180.0, 180.0)
    elif rule.metric_type == "blood_glucose":
        rule.critical_min = max(payload.critical_min or 70.0, 70.0)
        rule.critical_max = min(payload.critical_max or 250.0, 250.0)
    else:
        if payload.critical_min is not None: rule.critical_min = payload.critical_min
        if payload.critical_max is not None: rule.critical_max = payload.critical_max

    # Set doctor attribution
    rule.source = payload.source or "doctor_prescribed"
    rule.set_by_doctor_name = payload.set_by_doctor_name or rule.set_by_doctor_name
    rule.set_on = payload.set_on or datetime.utcnow().strftime("%Y-%m-%d")
    if payload.notes is not None:
        rule.notes = payload.notes
    rule.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rule)
    return rule

@router.post("/reset-to-guidelines", response_model=List[AlertRuleOut])
def reset_to_general_guidelines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resets patient targets back to general guidelines."""
    guideline_defaults = {
        "blood_pressure": {"target_min": 110.0, "target_max": 130.0, "warning_min": 131.0, "warning_max": 140.0, "critical_min": 90.0, "critical_max": 180.0},
        "blood_glucose": {"target_min": 80.0, "target_max": 125.0, "warning_min": 126.0, "warning_max": 140.0, "critical_min": 70.0, "critical_max": 250.0},
        "heart_rate": {"target_min": 60.0, "target_max": 82.0, "warning_min": 83.0, "warning_max": 95.0, "critical_min": 50.0, "critical_max": 100.0},
        "weight": {"target_min": 75.0, "target_max": 80.0, "warning_min": 81.0, "warning_max": 84.0, "critical_min": 70.0, "critical_max": 86.0},
    }

    rules = db.query(AlertRule).filter(AlertRule.patient_id == current_user.id).all()
    for r in rules:
        r.source = "guideline_default"
        r.set_by_doctor_name = None
        r.set_on = None
        r.notes = "General guideline default, not personalised"
        defaults = guideline_defaults.get(r.metric_type)
        if defaults:
            r.target_min = defaults.get("target_min", r.target_min)
            r.target_max = defaults.get("target_max", r.target_max)
            r.warning_min = defaults.get("warning_min", r.warning_min)
            r.warning_max = defaults.get("warning_max", r.warning_max)
            r.critical_min = defaults.get("critical_min", r.critical_min)
            r.critical_max = defaults.get("critical_max", r.critical_max)
        r.updated_at = datetime.utcnow()
    db.commit()
    return rules
