"""
CareChrono - Continuous Vitals Monitoring Route
Handles vital readings, trend computations, sparklines, and triggers smart alerts.
Enforces non-editable safety floors:
- BP >= 180/120 mmHg -> Critical alert
- Glucose < 70 or > 250 mg/dL -> Critical alert
Phrasing strictly follows 'attention may be needed'.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, VitalReading, AlertRule, SmartAlert
from ..schemas import (
    VitalReadingCreate, VitalReadingOut, MetricTrendData, SparklinePoint
)
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/vitals", tags=["Vitals"])

def format_rule_target_display(rule, metric_type: str) -> str:
    if not rule:
        return "General guideline, not personalised"
    val_str = f"<{int(rule.target_max) if rule.target_max else 130}{'/80' if metric_type == 'blood_pressure' else ''}"
    if rule.source == "doctor_prescribed" and rule.set_by_doctor_name:
        date_str = ""
        if rule.set_on:
            raw = str(rule.set_on).strip()
            try:
                dt = datetime.strptime(raw[:10], "%Y-%m-%d")
                date_str = f", {dt.strftime('%d %b')}"
            except Exception:
                date_str = f", {raw}"
        return f"Target {val_str} ({rule.set_by_doctor_name}{date_str})"
    else:
        return "General guideline, not personalised"

def evaluate_reading_against_thresholds(reading: VitalReading, db: Session):
    """
    Evaluates vital readings.
    1. First checks non-negotiable fixed safety floors (BP >= 180/120, Glucose < 70 or > 250).
    2. Then checks patient's personal targets (from doctor or general guidelines).
    Safety rules:
    - Never diagnoses
    - Phrases alerts as 'attention may be needed'
    - Critical alerts flag caregiver notification
    """
    val = reading.value
    dia = reading.secondary_value
    is_critical = False
    is_warning = False
    msg = ""
    target_display = ""

    # 1. FIXED SAFETY FLOORS (Cannot be loosened or disabled)
    if reading.metric_type == "blood_pressure":
        if val >= 180.0 or (dia and dia >= 120.0):
            is_critical = True
            bp_val_str = f"{val:g}{'/' + str(int(dia)) if dia else ''}"
            msg = f"Reading of {bp_val_str} mmHg reached the critical safety floor (>= 180/120 mmHg). Attention may be needed immediately; please rest quietly and contact your care team or emergency service if symptoms are present."
            target_display = "Safety Floor: Critical >= 180/120 mmHg"
    elif reading.metric_type == "blood_glucose":
        if val < 70.0:
            is_critical = True
            msg = f"Reading of {val:g} mg/dL is below the critical safety floor (< 70 mg/dL). Attention may be needed immediately; take fast-acting carbohydrates as guided by your care plan."
            target_display = "Safety Floor: Critical < 70 mg/dL"
        elif val > 250.0:
            is_critical = True
            msg = f"Reading of {val:g} mg/dL is above the critical safety floor (> 250 mg/dL). Attention may be needed immediately; hydrate and follow your plan."
            target_display = "Safety Floor: Critical > 250 mg/dL"

    # 2. PATIENT'S PERSONAL TARGETS (Doctor-prescribed or General Guidelines)
    rule = db.query(AlertRule).filter(
        (AlertRule.patient_id == reading.patient_id) | (AlertRule.patient_id.is_(None)),
        AlertRule.metric_type == reading.metric_type
    ).first()

    if rule:
        # Determine target label
        if not target_display:
            target_display = format_rule_target_display(rule, reading.metric_type)

        # Check personalized warnings/critical if not already triggered by fixed floor
        if not is_critical:
            if rule.critical_max and val >= rule.critical_max:
                is_critical = True
                msg = f"Reading of {val:g} {reading.unit} is notably above your target ({target_display}). Attention may be needed; please rest and recheck."
            elif rule.critical_min and val <= rule.critical_min:
                is_critical = True
                msg = f"Reading of {val:g} {reading.unit} is below your target ({target_display}). Attention may be needed."
            elif rule.warning_max and val >= rule.warning_max:
                is_warning = True
                msg = f"Reading of {val:g} {reading.unit} is above your target ({target_display}). Attention may be needed."
            elif rule.warning_min and val <= rule.warning_min:
                is_warning = True
                msg = f"Reading of {val:g} {reading.unit} is slightly lower than your target. Attention may be needed."

            # Blood pressure secondary diastolic
            if reading.metric_type == "blood_pressure" and dia:
                if dia >= 95.0 and not is_critical:
                    is_critical = True
                    msg = f"Diastolic reading of {dia:g} mmHg is elevated. Attention may be needed."
                elif dia >= 85.0 and not is_warning and not is_critical:
                    is_warning = True
                    msg = f"Diastolic reading of {dia:g} mmHg is above target. Attention may be needed."

    if is_critical or is_warning:
        readable_metric = reading.metric_type.replace('_', ' ').title()
        alert = SmartAlert(
            patient_id=reading.patient_id,
            reading_id=reading.id,
            severity="critical" if is_critical else "warning",
            metric_type=reading.metric_type,
            title=f"Attention may be needed: {readable_metric}",
            message=msg,
            measured_value=f"{val:g}{' / ' + str(int(dia)) if dia else ''} {reading.unit}",
            clinician_target=target_display or f"Target < {rule.target_max if rule else 130} {reading.unit}",
            is_acknowledged=False,
            caregiver_notified=is_critical
        )
        db.add(alert)
        db.commit()

@router.post("", response_model=VitalReadingOut)
def log_vital_reading(
    reading_in: VitalReadingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = reading_in.patient_id or current_user.id
    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to log vitals for this patient")

    reading = VitalReading(
        patient_id=target_patient_id,
        metric_type=reading_in.metric_type,
        value=reading_in.value,
        secondary_value=reading_in.secondary_value,
        unit=reading_in.unit,
        context=reading_in.context,
        notes=reading_in.notes,
        logged_by=current_user.role
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Evaluate against safety floors and personal targets
    evaluate_reading_against_thresholds(reading, db)

    return reading

@router.get("/trends", response_model=List[MetricTrendData])
def get_vitals_trends(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access vitals")

    # Fetch patient's active rules for target text
    rules = {
        r.metric_type: r for r in db.query(AlertRule).filter(
            (AlertRule.patient_id == target_patient_id) | (AlertRule.patient_id == None)
        ).all()
    }

    metrics_config = [
        {"type": "blood_pressure", "label": "Blood Pressure", "unit": "mmHg", "target": 125.0},
        {"type": "blood_glucose", "label": "Blood Glucose (Fasting)", "unit": "mg/dL", "target": 110.0},
        {"type": "heart_rate", "label": "Resting Heart Rate", "unit": "bpm", "target": 72.0},
        {"type": "weight", "label": "Body Weight", "unit": "kg", "target": 78.0}
    ]

    result: List[MetricTrendData] = []

    for cfg in metrics_config:
        mtype = cfg["type"]
        readings = db.query(VitalReading).filter(
            VitalReading.patient_id == target_patient_id,
            VitalReading.metric_type == mtype
        ).order_by(VitalReading.logged_at.asc()).all()

        rule = rules.get(mtype)
        target_text = format_rule_target_display(rule, mtype)

        if not readings:
            result.append(MetricTrendData(
                metric_type=mtype,
                label=cfg["label"],
                unit=cfg["unit"],
                latest_value=cfg["target"],
                latest_secondary_value=80.0 if mtype == "blood_pressure" else None,
                status="normal",
                average_target=cfg["target"],
                clinician_target_text=target_text,
                history=[],
                change_vs_last_week_pct=0.0,
                is_improved=True
            ))
            continue

        latest = readings[-1]
        sparkline = [
            SparklinePoint(
                date=r.logged_at.strftime("%b %d"),
                value=round(r.value, 1),
                secondary_value=round(r.secondary_value, 1) if r.secondary_value else None
            )
            for r in readings[-14:]
        ]

        status = "normal"
        is_improved = True
        pct_change = 0.0

        if len(readings) >= 2:
            prev = readings[-2]
            if prev.value > 0:
                pct_change = round(((latest.value - prev.value) / prev.value) * 100, 1)

        if mtype == "blood_pressure":
            if latest.value >= 180 or (latest.secondary_value and latest.secondary_value >= 120):
                status = "critical"
                is_improved = False
            elif latest.value >= 140 or (latest.secondary_value and latest.secondary_value >= 90):
                status = "needs_attention"
                is_improved = False
            elif latest.value <= 130:
                status = "improved"
                is_improved = True
        elif mtype == "blood_glucose":
            if latest.value < 70 or latest.value > 250:
                status = "critical"
                is_improved = False
            elif latest.value >= 135:
                status = "needs_attention"
                is_improved = False
            elif latest.value <= 120:
                status = "improved"
                is_improved = True

        result.append(MetricTrendData(
            metric_type=mtype,
            label=cfg["label"],
            unit=cfg["unit"],
            latest_value=latest.value,
            latest_secondary_value=latest.secondary_value,
            status=status,
            average_target=rule.target_max if rule and rule.target_max else cfg["target"],
            clinician_target_text=target_text,
            history=sparkline,
            change_vs_last_week_pct=pct_change,
            is_improved=is_improved
        ))

    return result

@router.get("/history", response_model=List[VitalReadingOut])
def get_vitals_history(
    metric_type: Optional[str] = None,
    patient_id: Optional[int] = None,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access vitals")

    query = db.query(VitalReading).filter(VitalReading.patient_id == target_patient_id)
    if metric_type:
        query = query.filter(VitalReading.metric_type == metric_type)

    return query.order_by(VitalReading.logged_at.desc()).limit(limit).all()
