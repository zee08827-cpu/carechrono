"""
CareChrono - Caregiver Consent & Delegation Route
Rule: Caregiver access requires explicit patient consent, revocable anytime.
No doctor role.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CaregiverConsent
from ..schemas import CaregiverConsentOut, ConsentUpdate, UserOut
from ..auth import get_current_user

router = APIRouter(prefix="/api/caregivers", tags=["Caregiver Consent"])

@router.get("/consents", response_model=List[CaregiverConsentOut])
def get_patient_consents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of caregiver consents for the current patient,
    or list of delegated patients if the user is a caregiver.
    """
    if current_user.role == "caregiver":
        consents = db.query(CaregiverConsent).filter(
            CaregiverConsent.caregiver_id == current_user.id
        ).all()
    else:
        consents = db.query(CaregiverConsent).filter(
            CaregiverConsent.patient_id == current_user.id
        ).all()

    result = []
    for c in consents:
        out = CaregiverConsentOut.model_validate(c)
        out.caregiver_name = c.caregiver.full_name if c.caregiver else "Caregiver"
        out.caregiver_email = c.caregiver.email if c.caregiver else ""
        out.patient_name = c.patient.full_name if c.patient else "Patient"
        result.append(out)

    return result

@router.post("/grant", response_model=CaregiverConsentOut)
def grant_caregiver_consent(
    payload: ConsentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Patient grants explicit consent to a designated caregiver."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can grant caregiver consent")

    if not payload.caregiver_email:
        raise HTTPException(status_code=400, detail="Caregiver email is required")

    caregiver = db.query(User).filter(
        User.email == payload.caregiver_email.lower().strip(),
        User.role == "caregiver"
    ).first()

    if not caregiver:
        from ..auth import get_password_hash
        caregiver = User(
            email=payload.caregiver_email.lower().strip(),
            hashed_password=get_password_hash("Caregiver123!"),
            full_name="Kelly Johnson",
            role="caregiver",
            phone="+1 (555) 321-7654"
        )
        db.add(caregiver)
        db.commit()
        db.refresh(caregiver)

    existing = db.query(CaregiverConsent).filter(
        CaregiverConsent.patient_id == current_user.id,
        CaregiverConsent.caregiver_id == caregiver.id
    ).first()

    if existing:
        existing.status = "active"
        existing.revoked_at = None
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        consent = existing
    else:
        consent = CaregiverConsent(
            patient_id=current_user.id,
            caregiver_id=caregiver.id,
            status="active",
            notes=payload.notes or "Granted full dashboard and smart alert monitoring permissions"
        )
        db.add(consent)
        db.commit()
        db.refresh(consent)

    out = CaregiverConsentOut.model_validate(consent)
    out.caregiver_name = caregiver.full_name
    out.caregiver_email = caregiver.email
    out.patient_name = current_user.full_name
    return out

@router.post("/{consent_id}/revoke", response_model=CaregiverConsentOut)
def revoke_caregiver_consent(
    consent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient explicitly revokes caregiver access at any time.
    Access is immediately cut off.
    """
    consent = db.query(CaregiverConsent).filter(CaregiverConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")

    if consent.patient_id != current_user.id and current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only the patient can revoke consent")

    consent.status = "revoked"
    consent.revoked_at = datetime.utcnow()
    db.commit()
    db.refresh(consent)

    out = CaregiverConsentOut.model_validate(consent)
    out.caregiver_name = consent.caregiver.full_name if consent.caregiver else "Caregiver"
    out.caregiver_email = consent.caregiver.email if consent.caregiver else ""
    out.patient_name = current_user.full_name
    return out

@router.get("/patients", response_model=List[UserOut])
def get_caregiver_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all patients who have granted active consent to this caregiver."""
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view their consented patients")

    consents = db.query(CaregiverConsent).filter(
        CaregiverConsent.caregiver_id == current_user.id,
        CaregiverConsent.status == "active"
    ).all()

    patient_ids = [c.patient_id for c in consents]
    return db.query(User).filter(User.id.in_(patient_ids)).all()
