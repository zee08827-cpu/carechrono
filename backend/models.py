"""
CareChrono - SQLAlchemy Models
Defines all entities for patient-centred chronic care tracking.
Roles: strictly 'patient' and 'caregiver'.
Patients own their data and share it themselves.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    """Users in CareChrono: patient or caregiver only."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # strictly patient | caregiver
    phone = Column(String(50), nullable=True)
    conditions = Column(String(255), nullable=True)  # e.g., "Type 2 Diabetes, Hypertension"
    avatar_url = Column(String(500), nullable=True)
    is_senior_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    records = relationship("HealthRecord", back_populates="patient", cascade="all, delete-orphan")
    vital_readings = relationship("VitalReading", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("MedicationSchedule", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("SmartAlert", back_populates="patient", cascade="all, delete-orphan")
    consultations_as_patient = relationship(
        "Consultation",
        foreign_keys="Consultation.patient_id",
        back_populates="patient",
        cascade="all, delete-orphan"
    )

class CaregiverConsent(Base):
    """
    Patient-caregiver consent ledger.
    Requires explicit patient consent; revocable at any time.
    """
    __tablename__ = "caregiver_consents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="active")  # active | revoked | pending
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    patient = relationship("User", foreign_keys=[patient_id])
    caregiver = relationship("User", foreign_keys=[caregiver_id])

class Consultation(Base):
    """
    Encounter records for diffing what changed between doctor visits.
    doctor_name is preserved as plain text. No doctor user login required.
    """
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_name = Column(String(255), nullable=False)  # Plain text doctor name
    specialty = Column(String(255), nullable=True)
    clinic_name = Column(String(255), nullable=True)
    visit_date = Column(DateTime, nullable=False)
    chief_complaint = Column(Text, nullable=True)
    clinical_assessment = Column(Text, nullable=True)
    plan_notes = Column(Text, nullable=True)
    lifestyle_advice = Column(Text, nullable=True)
    next_follow_up = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id], back_populates="consultations_as_patient")
    medications_discussed = relationship("ConsultationMedication", back_populates="consultation", cascade="all, delete-orphan")
    vitals_recorded = relationship("ConsultationVital", back_populates="consultation", cascade="all, delete-orphan")

class ConsultationMedication(Base):
    """Medication changes recorded during a specific consultation."""
    __tablename__ = "consultation_medications"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    change_status = Column(String(50), default="continued")  # new | adjusted | continued | discontinued
    reason_for_change = Column(String(255), nullable=True)

    consultation = relationship("Consultation", back_populates="medications_discussed")

class ConsultationVital(Base):
    """Key clinical vitals captured at the consultation."""
    __tablename__ = "consultation_vitals"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(100), nullable=False)  # bp_systolic, bp_diastolic, blood_glucose, heart_rate, weight, hba1c
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)

    consultation = relationship("Consultation", back_populates="vitals_recorded")

class HealthRecord(Base):
    """Unified health records: Folder-style cards for labs, notes, prescriptions."""
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # consultation | lab | prescription | imaging | other
    record_date = Column(DateTime, nullable=False)
    provider_name = Column(String(255), nullable=True)
    facility = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    key_findings = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    file_type = Column(String(50), default="pdf")
    file_url = Column(String(500), nullable=True)
    file_size_kb = Column(Integer, default=240)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="records")

class VitalReading(Base):
    """Continuous home-monitoring vital readings logged by patient or caregiver."""
    __tablename__ = "vital_readings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(100), nullable=False)  # blood_glucose | blood_pressure | heart_rate | weight | hba1c
    value = Column(Float, nullable=False)  # Main value or systolic for blood_pressure
    secondary_value = Column(Float, nullable=True)  # Diastolic for blood_pressure
    unit = Column(String(50), nullable=False)
    context = Column(String(100), nullable=True)
    notes = Column(String(255), nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    logged_by = Column(String(50), default="patient")  # patient | caregiver

    patient = relationship("User", back_populates="vital_readings")

class MedicationSchedule(Base):
    """Active prescription schedules for medication reminders and guidance."""
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    time_of_day = Column(String(50), nullable=False)  # morning | afternoon | evening | bedtime
    instructions = Column(String(255), nullable=True)
    purpose = Column(String(255), nullable=True)
    prescribed_by = Column(String(255), nullable=True)
    remaining_doses = Column(Integer, default=30)
    total_doses = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)

    patient = relationship("User", back_populates="medications")
    adherences = relationship("MedicationAdherence", back_populates="schedule", cascade="all, delete-orphan")

class MedicationAdherence(Base):
    """Daily medication intake tracking log."""
    __tablename__ = "medication_adherences"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date_str = Column(String(20), nullable=False)  # YYYY-MM-DD
    time_slot = Column(String(50), nullable=False)
    status = Column(String(50), default="taken")
    logged_at = Column(DateTime, default=datetime.utcnow)

    schedule = relationship("MedicationSchedule", back_populates="adherences")

class AlertRule(Base):
    """
    Alert target rules set by the patient or populated from general guidelines.
    Contains:
    - source: 'guideline_default' | 'doctor_prescribed'
    - set_by_doctor_name: text, optional
    - set_on: text/date, optional
    """
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    metric_type = Column(String(100), nullable=False)  # blood_pressure | blood_glucose | heart_rate | weight
    target_min = Column(Float, nullable=True)
    target_max = Column(Float, nullable=True)
    warning_min = Column(Float, nullable=True)
    warning_max = Column(Float, nullable=True)
    critical_min = Column(Float, nullable=True)
    critical_max = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    source = Column(String(50), default="guideline_default")  # guideline_default | doctor_prescribed
    set_by_doctor_name = Column(String(255), nullable=True)  # text, optional
    set_on = Column(String(50), nullable=True)  # date, optional
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])

class SmartAlert(Base):
    """
    Smart alerts generated when readings exceed targets or trigger safety floors.
    Phrased with non-diagnostic 'attention may be needed'.
    """
    __tablename__ = "smart_alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reading_id = Column(Integer, ForeignKey("vital_readings.id", ondelete="SET NULL"), nullable=True)
    severity = Column(String(50), nullable=False)  # warning | critical
    metric_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    measured_value = Column(String(100), nullable=False)
    clinician_target = Column(String(100), nullable=False)  # e.g. "Target <130/80 (Dr. Chen)"
    is_acknowledged = Column(Boolean, default=False)
    caregiver_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="alerts")
    reading = relationship("VitalReading")

class DoctorShareToken(Base):
    """
    Temporary read-only token for sharing records with a doctor (expires in 24 hours).
    No doctor login required.
    """
    __tablename__ = "doctor_share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    notes = Column(String(255), nullable=True)
    is_revoked = Column(Boolean, default=False)

    patient = relationship("User", foreign_keys=[patient_id])
