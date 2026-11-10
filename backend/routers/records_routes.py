"""
CareChrono - Unified Health Records Route
Manages folder-style clinical records: labs, doctor notes, imaging, and prescriptions.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, HealthRecord
from ..schemas import HealthRecordOut, HealthRecordCreate
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/records", tags=["Health Records"])

@router.get("", response_model=List[HealthRecordOut])
def get_records(
    category: Optional[str] = None,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access these health records")

    query = db.query(HealthRecord).filter(HealthRecord.patient_id == target_patient_id)
    if category and category != "all":
        query = query.filter(HealthRecord.category == category)

    return query.order_by(HealthRecord.record_date.desc()).all()

@router.post("", response_model=HealthRecordOut)
def create_record(
    record_in: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = record_in.patient_id or current_user.id
    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to create record")

    new_rec = HealthRecord(
        patient_id=target_patient_id,
        title=record_in.title,
        category=record_in.category,
        record_date=record_in.record_date,
        provider_name=record_in.provider_name or "Dr. Richard Chen, MD",
        facility=record_in.facility or "Metro Chronic Health Center",
        summary=record_in.summary,
        key_findings=record_in.key_findings,
        tags=record_in.tags,
        file_type=record_in.file_type,
        file_url=record_in.file_url or "/sample-report.pdf",
        file_size_kb=record_in.file_size_kb
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

@router.get("/{record_id}", response_model=HealthRecordOut)
def get_record_detail(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")
    if not verify_patient_access(record.patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this record")
    return record
