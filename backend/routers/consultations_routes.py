"""
CareChrono - Consultations & Change Comparison Route
Enables patients and their consented caregivers to see what changed between visits.
doctor_name is preserved as plain text.
Includes 24-hour read-only sharing link for new doctors (no login required).
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Consultation, ConsultationMedication, ConsultationVital, DoctorShareToken, VitalReading, HealthRecord
from ..schemas import (
    ConsultationOut, ConsultationComparisonOut, ConsultationDiffItem, DoctorShareCreate, DoctorShareOut,
    VitalReadingOut, HealthRecordOut
)
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/consultations", tags=["Consultations"])

@router.get("", response_model=List[ConsultationOut])
def get_consultations(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this patient's records")

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == target_patient_id
    ).order_by(Consultation.visit_date.desc()).all()

    return consultations

@router.get("/compare", response_model=ConsultationComparisonOut)
def compare_consultations(
    c1_id: Optional[int] = None,
    c2_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes a comprehensive diff between two doctor visits.
    Identifies medication adjustments, vitals trends, clinical goals, and generates an accessible summary.
    """
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this patient's consultations")

    # If IDs not specified, take the two most recent consultations
    if not c1_id or not c2_id:
        recent_two = db.query(Consultation).filter(
            Consultation.patient_id == target_patient_id
        ).order_by(Consultation.visit_date.desc()).limit(2).all()
        if len(recent_two) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least two consultations are needed to generate a comparison."
            )
        consult_recent = recent_two[0]
        consult_earlier = recent_two[1]
    else:
        c1 = db.query(Consultation).filter(Consultation.id == c1_id).first()
        c2 = db.query(Consultation).filter(Consultation.id == c2_id).first()
        if not c1 or not c2:
            raise HTTPException(status_code=404, detail="One or both consultations not found")
        if c1.visit_date > c2.visit_date:
            consult_recent, consult_earlier = c1, c2
        else:
            consult_recent, consult_earlier = c2, c1

    days_between = abs((consult_recent.visit_date - consult_earlier.visit_date).days)

    diff_summary: List[ConsultationDiffItem] = []
    improved_count = 0
    attention_count = 0

    # 1. Compare Vitals
    earlier_vitals = {v.metric_type: v for v in consult_earlier.vitals_recorded}
    recent_vitals = {v.metric_type: v for v in consult_recent.vitals_recorded}

    all_vital_keys = set(earlier_vitals.keys()).union(set(recent_vitals.keys()))

    for vkey in all_vital_keys:
        e_v = earlier_vitals.get(vkey)
        r_v = recent_vitals.get(vkey)
        if e_v and r_v:
            diff_val = r_v.value - e_v.value
            readable_name = vkey.replace('_', ' ').title()
            
            is_improved = False
            is_attention = False
            direction = "neutral"

            if "bp_systolic" in vkey or "bp_diastolic" in vkey:
                if diff_val < -3:
                    is_improved = True
                    direction = "down"
                elif diff_val > 5:
                    is_attention = True
                    direction = "up"
            elif "blood_glucose" in vkey or "hba1c" in vkey:
                if diff_val < -5 or (vkey == "hba1c" and diff_val < -0.2):
                    is_improved = True
                    direction = "down"
                elif diff_val > 5:
                    is_attention = True
                    direction = "up"
            elif "heart_rate" in vkey:
                if abs(r_v.value - 72) < abs(e_v.value - 72):
                    is_improved = True

            status_label = "improved" if is_improved else ("needs_attention" if is_attention else "stable")
            if is_improved:
                improved_count += 1
            elif is_attention:
                attention_count += 1

            diff_summary.append(ConsultationDiffItem(
                category="vitals",
                item_name=readable_name,
                old_value=f"{e_v.value:g} {e_v.unit}",
                new_value=f"{r_v.value:g} {r_v.unit}",
                semantic_status=status_label,
                change_direction=direction,
                note=f"Shift of {abs(diff_val):.1f} {r_v.unit}"
            ))

    # 2. Compare Medications
    earlier_meds = {m.medication_name.lower(): m for m in consult_earlier.medications_discussed}
    recent_meds = {m.medication_name.lower(): m for m in consult_recent.medications_discussed}

    for name, r_med in recent_meds.items():
        if name not in earlier_meds:
            diff_summary.append(ConsultationDiffItem(
                category="medications",
                item_name=r_med.medication_name,
                old_value="Not prescribed",
                new_value=f"{r_med.dosage} ({r_med.frequency})",
                semantic_status="new",
                change_direction="up",
                note=r_med.reason_for_change or "New therapy initiated"
            ))
        else:
            e_med = earlier_meds[name]
            if e_med.dosage != r_med.dosage or e_med.frequency != r_med.frequency:
                diff_summary.append(ConsultationDiffItem(
                    category="medications",
                    item_name=r_med.medication_name,
                    old_value=f"{e_med.dosage} ({e_med.frequency})",
                    new_value=f"{r_med.dosage} ({r_med.frequency})",
                    semantic_status="changed",
                    change_direction="neutral",
                    note=r_med.reason_for_change or "Dosage adjusted by doctor"
                ))

    for name, e_med in earlier_meds.items():
        if name not in recent_meds:
            diff_summary.append(ConsultationDiffItem(
                category="medications",
                item_name=e_med.medication_name,
                old_value=f"{e_med.dosage} ({e_med.frequency})",
                new_value="Discontinued",
                semantic_status="discontinued",
                change_direction="down",
                note="Therapy concluded or replaced"
            ))

    # 3. Assessment diff
    if consult_recent.clinical_assessment != consult_earlier.clinical_assessment:
        diff_summary.append(ConsultationDiffItem(
            category="assessment",
            item_name="Clinical Assessment",
            old_value=consult_earlier.clinical_assessment,
            new_value=consult_recent.clinical_assessment,
            semantic_status="improved" if improved_count >= attention_count else "needs_attention",
            note="Doctor's updated assessment"
        ))

    # 4. Lifestyle advice diff
    if consult_recent.lifestyle_advice:
        diff_summary.append(ConsultationDiffItem(
            category="lifestyle",
            item_name="Lifestyle & Diet Plan",
            old_value=consult_earlier.lifestyle_advice or "Standard maintenance",
            new_value=consult_recent.lifestyle_advice,
            semantic_status="stable",
            note="Updated daily patient guidance"
        ))

    overall_takeaway = (
        f"Over the {days_between} days between your visit with {consult_earlier.doctor_name} "
        f"and {consult_recent.doctor_name}, {improved_count} key metric(s) showed positive improvement "
        f"towards targets. Note any medication adjustments above."
    )

    return ConsultationComparisonOut(
        consultation_earlier=consult_earlier,
        consultation_recent=consult_recent,
        days_between=days_between,
        diff_summary=diff_summary,
        improved_count=improved_count,
        attention_count=attention_count,
        overall_takeaway=overall_takeaway
    )

# 24-Hour Read-Only Doctor Share Link (No login required)
@router.post("/share-link", response_model=DoctorShareOut)
def create_doctor_share_link(
    payload: DoctorShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient generates a temporary 24-hour read-only link to share with a new doctor.
    No doctor account or login is required.
    """
    token_str = str(uuid.uuid4()).replace("-", "")[:16]
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=24)

    share_record = DoctorShareToken(
        patient_id=current_user.id,
        token=token_str,
        created_at=now,
        expires_at=expires_at,
        notes=payload.notes or "Read-only summary for new doctor visit"
    )
    db.add(share_record)
    db.commit()

    return DoctorShareOut(
        share_url=f"/shared-doctor-summary?token={token_str}",
        token=token_str,
        created_at=now,
        expires_at=expires_at,
        hours_remaining=24,
        patient_name=current_user.full_name
    )

@router.get("/shared/{token}")
def get_shared_doctor_view(token: str, db: Session = Depends(get_db)):
    """
    Public read-only view accessible by a new doctor using a 24-hour share token.
    No login required.
    """
    share = db.query(DoctorShareToken).filter(
        DoctorShareToken.token == token,
        DoctorShareToken.is_revoked.is_(False)
    ).first()

    if not share or share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Share link is invalid or has expired (links expire in 24 hours)")

    patient = db.query(User).filter(User.id == share.patient_id).first()
    consultations = db.query(Consultation).filter(Consultation.patient_id == patient.id).order_by(Consultation.visit_date.desc()).all()
    records = db.query(HealthRecord).filter(HealthRecord.patient_id == patient.id).all()
    vitals = db.query(VitalReading).filter(VitalReading.patient_id == patient.id).order_by(VitalReading.logged_at.desc()).limit(14).all()

    hours_left = max(0, int((share.expires_at - datetime.utcnow()).total_seconds() / 3600))

    return {
        "status": "active",
        "hours_remaining": hours_left,
        "patient": {
            "full_name": patient.full_name,
            "conditions": patient.conditions,
        },
        "consultations": [ConsultationOut.model_validate(c).model_dump() for c in consultations],
        "recent_vitals": [VitalReadingOut.model_validate(v).model_dump() for v in vitals],
        "records": [HealthRecordOut.model_validate(r).model_dump() for r in records],
        "safety_disclaimer": "Shared via patient-directed CareChrono 24-hour read-only link. Not a substitute for clinical judgment."
    }
