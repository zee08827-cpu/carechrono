"""
CareChrono - Pydantic Schemas
Strict typing for patient-centred data exchange.
Roles: 'patient' | 'caregiver'.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Auth & Users
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "patient"  # strictly 'patient' or 'caregiver'
    phone: Optional[str] = None
    conditions: Optional[str] = None
    avatar_url: Optional[str] = None
    is_senior_mode: bool = False

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

# Caregiver Consent
class CaregiverConsentOut(BaseModel):
    id: int
    patient_id: int
    caregiver_id: int
    caregiver_name: Optional[str] = None
    caregiver_email: Optional[str] = None
    patient_name: Optional[str] = None
    status: str  # active | revoked | pending
    granted_at: datetime
    revoked_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ConsentUpdate(BaseModel):
    caregiver_email: Optional[str] = None
    notes: Optional[str] = None

# Consultation Comparison
class ConsultationMedicationSchema(BaseModel):
    id: Optional[int] = None
    medication_name: str
    dosage: str
    frequency: str
    change_status: str = "continued"  # new | adjusted | continued | discontinued
    reason_for_change: Optional[str] = None

    class Config:
        from_attributes = True

class ConsultationVitalSchema(BaseModel):
    id: Optional[int] = None
    metric_type: str
    value: float
    unit: str

    class Config:
        from_attributes = True

class ConsultationOut(BaseModel):
    id: int
    patient_id: int
    doctor_name: str  # Plain text doctor name
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    visit_date: datetime
    chief_complaint: Optional[str] = None
    clinical_assessment: Optional[str] = None
    plan_notes: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    next_follow_up: Optional[str] = None
    created_at: datetime
    medications_discussed: List[ConsultationMedicationSchema] = []
    vitals_recorded: List[ConsultationVitalSchema] = []

    class Config:
        from_attributes = True

class ConsultationDiffItem(BaseModel):
    category: str
    item_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    semantic_status: str  # 'improved', 'needs_attention', 'changed', 'discontinued', 'new', 'stable'
    change_direction: Optional[str] = None
    note: Optional[str] = None

class ConsultationComparisonOut(BaseModel):
    consultation_earlier: ConsultationOut
    consultation_recent: ConsultationOut
    days_between: int
    diff_summary: List[ConsultationDiffItem]
    improved_count: int
    attention_count: int
    overall_takeaway: str

# Unified Health Records
class HealthRecordBase(BaseModel):
    title: str
    category: str  # consultation | lab | prescription | imaging | other
    record_date: datetime
    provider_name: Optional[str] = None
    facility: Optional[str] = None
    summary: Optional[str] = None
    key_findings: Optional[str] = None
    tags: Optional[str] = None
    file_type: str = "pdf"
    file_url: Optional[str] = None
    file_size_kb: int = 240

class HealthRecordCreate(HealthRecordBase):
    patient_id: Optional[int] = None

class HealthRecordOut(HealthRecordBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Continuous Monitoring & Vitals
class VitalReadingCreate(BaseModel):
    patient_id: Optional[int] = None
    metric_type: str
    value: float
    secondary_value: Optional[float] = None
    unit: str
    context: Optional[str] = "resting"
    notes: Optional[str] = None
    logged_by: Optional[str] = "patient"

class VitalReadingOut(BaseModel):
    id: int
    patient_id: int
    metric_type: str
    value: float
    secondary_value: Optional[float] = None
    unit: str
    context: Optional[str] = None
    notes: Optional[str] = None
    logged_at: datetime
    logged_by: str

    class Config:
        from_attributes = True

class SparklinePoint(BaseModel):
    date: str
    value: float
    secondary_value: Optional[float] = None

class MetricTrendData(BaseModel):
    metric_type: str
    label: str
    unit: str
    latest_value: float
    latest_secondary_value: Optional[float] = None
    status: str
    average_target: float
    clinician_target_text: str
    history: List[SparklinePoint]
    change_vs_last_week_pct: float
    is_improved: bool

# Medications & Reminders
class MedicationScheduleBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    time_of_day: str
    instructions: Optional[str] = None
    purpose: Optional[str] = None
    prescribed_by: Optional[str] = None
    remaining_doses: int = 30
    total_doses: int = 30
    is_active: bool = True

class MedicationScheduleCreate(MedicationScheduleBase):
    patient_id: Optional[int] = None

class MedicationScheduleOut(MedicationScheduleBase):
    id: int
    patient_id: int
    taken_today: bool = False

    class Config:
        from_attributes = True

class MedicationAdherenceLog(BaseModel):
    schedule_id: int
    status: str = "taken"
    time_slot: Optional[str] = "morning"

# Health Bloom Goal Status
class HealthBloomStatus(BaseModel):
    petals_earned: int = 0
    total_petals: int = 5
    bloom_stage: str = "budding"
    bloom_percentage: int = 0
    goals_completed: List[str] = []
    goals_pending: List[str] = []
    motivational_message: str = "Every healthy step helps your flower bloom."

# AlertRule (Replaces ClinicianThreshold)
class AlertRuleBase(BaseModel):
    metric_type: str
    target_min: Optional[float] = None
    target_max: Optional[float] = None
    warning_min: Optional[float] = None
    warning_max: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    unit: str
    source: str = "guideline_default"  # guideline_default | doctor_prescribed
    set_by_doctor_name: Optional[str] = None
    set_on: Optional[str] = None
    notes: Optional[str] = None

class AlertRuleOut(AlertRuleBase):
    id: int
    patient_id: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertRuleUpdate(BaseModel):
    target_min: Optional[float] = None
    target_max: Optional[float] = None
    warning_min: Optional[float] = None
    warning_max: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    source: Optional[str] = "doctor_prescribed"
    set_by_doctor_name: Optional[str] = None
    set_on: Optional[str] = None
    notes: Optional[str] = None

# Smart Alerts
class SmartAlertOut(BaseModel):
    id: int
    patient_id: int
    reading_id: Optional[int] = None
    severity: str  # warning | critical
    metric_type: str
    title: str
    message: str
    measured_value: str
    clinician_target: str
    is_acknowledged: bool
    caregiver_notified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SeniorModeTriggerAlert(BaseModel):
    alert_type: str = "emergency_call"
    notes: Optional[str] = None

# Read-only Doctor Share Token (expires in 24 hours, no login required)
class DoctorShareCreate(BaseModel):
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

class DoctorShareOut(BaseModel):
    share_url: str
    token: str
    created_at: datetime
    expires_at: datetime
    hours_remaining: int
    patient_name: str
