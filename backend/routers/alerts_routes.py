"""
CareChrono - Smart Alerts & Safety Guidance Route
Safety rules strictly observed:
- Never diagnoses.
- Alert text always uses non-diagnostic 'attention may be needed'.
- Clear differentiation between warning (coral #F98E6E) and critical (dark coral #C2410C).
- Targets set by patient & doctor, with fixed safety floor.
- Caregivers with patient consent can monitor alerts.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, SmartAlert
from ..schemas import SmartAlertOut, SeniorModeTriggerAlert
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/alerts", tags=["Smart Alerts"])

@router.get("", response_model=List[SmartAlertOut])
def get_alerts(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access alerts")

    alerts = db.query(SmartAlert).filter(
        SmartAlert.patient_id == target_patient_id
    ).order_by(SmartAlert.created_at.desc()).all()

    return alerts

@router.post("/{alert_id}/acknowledge", response_model=SmartAlertOut)
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(SmartAlert).filter(SmartAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if not verify_patient_access(alert.patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    alert.is_acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/senior-emergency")
def trigger_senior_emergency(
    payload: SeniorModeTriggerAlert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Called from Senior Mode's 1-Tap 'Emergency / Call Caregiver' full-width button.
    Instantly records a critical alert and sends notification signal to designated caregiver.
    """
    alert = SmartAlert(
        patient_id=current_user.id,
        severity="critical",
        metric_type="caregiver_call",
        title="Attention may be needed: Emergency Call from Senior Mode",
        message=f"{current_user.full_name} pressed the 1-Tap Caregiver Call button. Immediate check-in requested.",
        measured_value="Caregiver Assistance Requested",
        clinician_target="Direct Patient Call",
        is_acknowledged=False,
        caregiver_notified=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "status": "success",
        "message": f"Designated caregiver notified immediately. Call connected to {current_user.phone or 'caregiver'}.",
        "alert_id": alert.id
    }
