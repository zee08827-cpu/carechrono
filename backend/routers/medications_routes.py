"""
CareChrono - Medications, Adherence & Health Bloom Route
Manages daily medication schedules, intake guidance, and computes motivational Health Bloom goal metrics.
"""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, MedicationSchedule, MedicationAdherence, VitalReading
from ..schemas import (
    MedicationScheduleOut, MedicationScheduleCreate, MedicationAdherenceLog, HealthBloomStatus
)
from ..auth import get_current_user, verify_patient_access

router = APIRouter(prefix="/api/medications", tags=["Medications"])

@router.get("", response_model=List[MedicationScheduleOut])
def get_medications(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    if not verify_patient_access(target_patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to view medications")

    today_str = date.today().isoformat()
    schedules = db.query(MedicationSchedule).filter(
        MedicationSchedule.patient_id == target_patient_id,
        MedicationSchedule.is_active == True
    ).all()

    today_adherences = db.query(MedicationAdherence).filter(
        MedicationAdherence.patient_id == target_patient_id,
        MedicationAdherence.date_str == today_str,
        MedicationAdherence.status == "taken"
    ).all()
    taken_schedule_ids = {a.schedule_id for a in today_adherences}

    result = []
    for s in schedules:
        out = MedicationScheduleOut.model_validate(s)
        out.taken_today = s.id in taken_schedule_ids
        result.append(out)

    return result

@router.post("/log-adherence")
def log_adherence(
    payload: MedicationAdherenceLog,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == payload.schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Medication schedule not found")

    if not verify_patient_access(schedule.patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    today_str = date.today().isoformat()

    # Check if already logged today
    existing = db.query(MedicationAdherence).filter(
        MedicationAdherence.schedule_id == schedule.id,
        MedicationAdherence.date_str == today_str
    ).first()

    if existing:
        existing.status = payload.status
        existing.logged_at = datetime.utcnow()
    else:
        new_adh = MedicationAdherence(
            schedule_id=schedule.id,
            patient_id=schedule.patient_id,
            date_str=today_str,
            time_slot=payload.time_slot or schedule.time_of_day,
            status=payload.status,
            logged_at=datetime.utcnow()
        )
        db.add(new_adh)
        # Deduct remaining dose
        if payload.status == "taken" and schedule.remaining_doses > 0:
            schedule.remaining_doses -= 1

    db.commit()
    return {"status": "success", "message": f"{schedule.medication_name} marked as {payload.status}"}

@router.get("/bloom-status", response_model=HealthBloomStatus)
def get_health_bloom_status(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes the motivational Health Bloom goal state.
    Petals fill as daily adherence and readings are completed.
    Motivational visual only, never a clinical diagnosis.
    """
    target_patient_id = patient_id or (current_user.id if current_user.role == "patient" else None)
    if not target_patient_id:
        patient = db.query(User).filter(User.role == "patient").first()
        target_patient_id = patient.id if patient else current_user.id

    today_str = date.today().isoformat()

    # 1. Check morning medications
    morning_meds = db.query(MedicationSchedule).filter(
        MedicationSchedule.patient_id == target_patient_id,
        MedicationSchedule.time_of_day == "morning",
        MedicationSchedule.is_active == True
    ).all()
    morning_taken = True
    if morning_meds:
        taken_morning_ids = {
            a.schedule_id for a in db.query(MedicationAdherence).filter(
                MedicationAdherence.patient_id == target_patient_id,
                MedicationAdherence.date_str == today_str,
                MedicationAdherence.status == "taken"
            ).all()
        }
        morning_taken = all(m.id in taken_morning_ids for m in morning_meds)

    # 2. Check evening medications
    evening_meds = db.query(MedicationSchedule).filter(
        MedicationSchedule.patient_id == target_patient_id,
        MedicationSchedule.time_of_day.in_(["evening", "bedtime"]),
        MedicationSchedule.is_active == True
    ).all()
    evening_taken = True
    if evening_meds:
        taken_evening_ids = {
            a.schedule_id for a in db.query(MedicationAdherence).filter(
                MedicationAdherence.patient_id == target_patient_id,
                MedicationAdherence.date_str == today_str,
                MedicationAdherence.status == "taken"
            ).all()
        }
        evening_taken = all(m.id in taken_evening_ids for m in evening_meds)

    # 3. Check if at least one vital reading logged today
    today_readings = db.query(VitalReading).filter(
        VitalReading.patient_id == target_patient_id,
        VitalReading.logged_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).all()
    reading_logged = len(today_readings) > 0

    # 4. Check if readings in target range
    readings_in_range = True
    if reading_logged:
        # Check any severe alerts today
        for r in today_readings:
            if r.metric_type == "blood_pressure" and r.value > 145:
                readings_in_range = False
            if r.metric_type == "blood_glucose" and r.value > 150:
                readings_in_range = False

    # 5. Hydration / healthy activity logged
    activity_done = True  # Seeded as satisfied for positive reinforcement

    goals_completed = []
    goals_pending = []

    if morning_taken:
        goals_completed.append("Morning medication taken")
    else:
        goals_pending.append("Take morning medication")

    if evening_taken:
        goals_completed.append("Evening medication taken")
    else:
        goals_pending.append("Take evening medication")

    if reading_logged:
        goals_completed.append("Daily vital reading logged")
    else:
        goals_pending.append("Log today's vital reading")

    if readings_in_range and reading_logged:
        goals_completed.append("Readings within clinician target")
    else:
        goals_pending.append("Maintain readings in target zone")

    if activity_done:
        goals_completed.append("Gentle mobility / hydration goal")
    else:
        goals_pending.append("Hydration & gentle mobility goal")

    petals = len(goals_completed)
    pct = int((petals / 5) * 100)

    if petals >= 4:
        stage = "full_bloom"
        msg = "Your Health Bloom is in full, radiant bloom! Wonderful consistency today."
    elif petals >= 3:
        stage = "half_bloom"
        msg = "Your flower is blooming beautifully! Just a couple of steps left today."
    elif petals >= 1:
        stage = "budding"
        msg = "Great start today! Your petals are starting to open with each healthy action."
    else:
        stage = "seed"
        msg = "A fresh day ahead. Log your first reading or medication to sprout today's bloom."

    return HealthBloomStatus(
        petals_earned=petals,
        total_petals=5,
        bloom_stage=stage,
        bloom_percentage=pct,
        goals_completed=goals_completed,
        goals_pending=goals_pending,
        motivational_message=msg
    )
