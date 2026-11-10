"""
CareChrono - Patient-Centred Demo Seed Script
Roles seeded: STRICTLY patient and caregiver. No doctor user.
Patients own their health records and enter targets set with their doctor.
"""
from datetime import datetime, timedelta, date
from .database import SessionLocal, engine, Base
from .models import (
    User, CaregiverConsent, Consultation, ConsultationMedication,
    ConsultationVital, HealthRecord, VitalReading, MedicationSchedule,
    MedicationAdherence, AlertRule, SmartAlert
)
from .auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(SmartAlert).delete()
    db.query(MedicationAdherence).delete()
    db.query(MedicationSchedule).delete()
    db.query(VitalReading).delete()
    db.query(HealthRecord).delete()
    db.query(ConsultationVital).delete()
    db.query(ConsultationMedication).delete()
    db.query(Consultation).delete()
    db.query(CaregiverConsent).delete()
    db.query(AlertRule).delete()
    db.query(User).delete()
    db.commit()

    print("[SEED] Seeding patient-centred CareChrono demo users (patient and caregiver only)...")

    # 1. Users: Strictly Patient Arthur and Caregiver Kelly. NO doctor user.
    patient = User(
        email="patient@carechrono.com",
        hashed_password=get_password_hash("Patient123!"),
        full_name="Arthur Pendelton",
        role="patient",
        phone="+1 (555) 789-2345",
        conditions="Type 2 Diabetes, Hypertension, Coronary Artery Disease",
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        is_senior_mode=False
    )

    caregiver = User(
        email="caregiver@carechrono.com",
        hashed_password=get_password_hash("Caregiver123!"),
        full_name="Kelly Johnson",
        role="caregiver",
        phone="+1 (555) 321-7654",
        conditions="Designated Family Caregiver (Daughter)",
        avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        is_senior_mode=False
    )

    db.add_all([patient, caregiver])
    db.commit()
    db.refresh(patient)
    db.refresh(caregiver)

    # 2. Caregiver Consent (Explicit patient consent, revocable anytime)
    consent = CaregiverConsent(
        patient_id=patient.id,
        caregiver_id=caregiver.id,
        status="active",
        notes="Arthur granted daughter Kelly full access to view daily vitals, medication adherence, and receive smart alerts."
    )
    db.add(consent)

    # 3. Alert Rules: Patient-entered doctor targets & General guidelines
    # Plus hardcoded safety floors: BP >= 180/120 and Glucose < 70 or > 250
    alert_rules = [
        AlertRule(
            patient_id=patient.id,
            metric_type="blood_pressure",
            target_min=110.0,
            target_max=130.0,
            warning_min=131.0,
            warning_max=140.0,
            critical_min=90.0,
            critical_max=180.0,  # Safety floor
            unit="mmHg",
            source="doctor_prescribed",
            set_by_doctor_name="Dr. Chen",
            set_on="12 Mar",
            notes="Tight systolic control < 130 mmHg advised by Dr. Chen to protect coronary perfusion and renal function."
        ),
        AlertRule(
            patient_id=patient.id,
            metric_type="blood_glucose",
            target_min=80.0,
            target_max=125.0,
            warning_min=126.0,
            warning_max=140.0,
            critical_min=70.0,   # Safety floor
            critical_max=250.0,  # Safety floor
            unit="mg/dL",
            source="doctor_prescribed",
            set_by_doctor_name="Dr. Chen",
            set_on="12 Mar",
            notes="Fasting target 80-125 mg/dL to prevent diabetic microvascular complications."
        ),
        AlertRule(
            patient_id=patient.id,
            metric_type="heart_rate",
            target_min=60.0,
            target_max=82.0,
            warning_min=83.0,
            warning_max=95.0,
            critical_min=50.0,
            critical_max=100.0,
            unit="bpm",
            source="guideline_default",
            set_by_doctor_name=None,
            set_on=None,
            notes="General guideline, not personalised"
        ),
        AlertRule(
            patient_id=patient.id,
            metric_type="weight",
            target_min=75.0,
            target_max=80.0,
            warning_min=81.0,
            warning_max=84.0,
            critical_min=70.0,
            critical_max=86.0,
            unit="kg",
            source="guideline_default",
            set_by_doctor_name=None,
            set_on=None,
            notes="General guideline, not personalised"
        )
    ]
    db.add_all(alert_rules)
    db.commit()

    # 4. Consultations: doctor_name stored as plain text
    now = datetime.utcnow()
    c_earlier = Consultation(
        patient_id=patient.id,
        doctor_name="Dr. Richard Chen, MD",
        specialty="Cardiology & Chronic Care",
        clinic_name="Metro Chronic Wellness Center",
        visit_date=now - timedelta(days=75),
        chief_complaint="Elevated evening blood pressure readings (148/94) and morning fatigue.",
        clinical_assessment="Hypertension Stage 2 mildly uncontrolled; T2 Diabetes HbA1c 7.6%. Needs medication titration.",
        plan_notes="Increase physical activity to 25 min walk daily. Increase Metformin; monitor BP twice daily.",
        lifestyle_advice="DASH diet adherence, sodium restricted to < 2000mg/day, 2L water intake.",
        next_follow_up="10 weeks for metabolic review"
    )

    c_recent = Consultation(
        patient_id=patient.id,
        doctor_name="Dr. Richard Chen, MD",
        specialty="Cardiology & Chronic Care",
        clinic_name="Metro Chronic Wellness Center",
        visit_date=now - timedelta(days=12),
        chief_complaint="Routine 10-week chronic follow-up. Arthur reports feeling more energized with daily walks.",
        clinical_assessment="Outstanding improvement! Blood pressure normalized to 126/80 mmHg. Fasting glucose well controlled at 114 mg/dL.",
        plan_notes="Therapy titration successful. Maintain current Lisinopril, adjust Metformin to 850mg XR, add Low-Dose Aspirin for cardioprotection.",
        lifestyle_advice="Continue daily 30 min morning walks. Keep logging daily readings in CareChrono.",
        next_follow_up="3 months routine review"
    )

    db.add_all([c_earlier, c_recent])
    db.commit()
    db.refresh(c_earlier)
    db.refresh(c_recent)

    # Vitals recorded at consultations
    db.add_all([
        ConsultationVital(consultation_id=c_earlier.id, metric_type="bp_systolic", value=148.0, unit="mmHg"),
        ConsultationVital(consultation_id=c_earlier.id, metric_type="bp_diastolic", value=94.0, unit="mmHg"),
        ConsultationVital(consultation_id=c_earlier.id, metric_type="blood_glucose", value=142.0, unit="mg/dL"),
        ConsultationVital(consultation_id=c_earlier.id, metric_type="heart_rate", value=84.0, unit="bpm"),
        ConsultationVital(consultation_id=c_earlier.id, metric_type="weight", value=82.5, unit="kg"),
        ConsultationVital(consultation_id=c_earlier.id, metric_type="hba1c", value=7.6, unit="%"),

        ConsultationVital(consultation_id=c_recent.id, metric_type="bp_systolic", value=126.0, unit="mmHg"),
        ConsultationVital(consultation_id=c_recent.id, metric_type="bp_diastolic", value=80.0, unit="mmHg"),
        ConsultationVital(consultation_id=c_recent.id, metric_type="blood_glucose", value=114.0, unit="mg/dL"),
        ConsultationVital(consultation_id=c_recent.id, metric_type="heart_rate", value=72.0, unit="bpm"),
        ConsultationVital(consultation_id=c_recent.id, metric_type="weight", value=79.2, unit="kg"),
        ConsultationVital(consultation_id=c_recent.id, metric_type="hba1c", value=6.9, unit="%"),
    ])

    # Medications discussed at consultations
    db.add_all([
        ConsultationMedication(consultation_id=c_earlier.id, medication_name="Metformin", dosage="500 mg", frequency="Twice daily", change_status="continued", reason_for_change="Baseline glycemic control"),
        ConsultationMedication(consultation_id=c_earlier.id, medication_name="Lisinopril", dosage="10 mg", frequency="Once daily (Morning)", change_status="continued", reason_for_change="Hypertension management"),
        ConsultationMedication(consultation_id=c_earlier.id, medication_name="Hydrochlorothiazide", dosage="12.5 mg", frequency="Once daily", change_status="continued", reason_for_change="Diuretic for fluid management"),

        ConsultationMedication(consultation_id=c_recent.id, medication_name="Metformin XR", dosage="850 mg", frequency="Twice daily", change_status="adjusted", reason_for_change="Switched to extended release for better GI tolerance"),
        ConsultationMedication(consultation_id=c_recent.id, medication_name="Lisinopril", dosage="10 mg", frequency="Once daily (Morning)", change_status="continued", reason_for_change="Blood pressure well controlled"),
        ConsultationMedication(consultation_id=c_recent.id, medication_name="Atorvastatin", dosage="20 mg", frequency="Once daily (Evening)", change_status="new", reason_for_change="Cardiovascular plaque stabilization"),
        ConsultationMedication(consultation_id=c_recent.id, medication_name="Aspirin Low-Dose", dosage="81 mg", frequency="Once daily (Morning)", change_status="new", reason_for_change="Secondary coronary event prevention"),
    ])
    db.commit()

    # 5. Active Medication Schedules
    med1 = MedicationSchedule(
        patient_id=patient.id,
        medication_name="Metformin XR",
        dosage="850 mg",
        frequency="Twice daily",
        time_of_day="morning",
        instructions="Take with breakfast to minimize digestive sensitivity",
        purpose="Type 2 Diabetes Blood Sugar Regulation",
        prescribed_by="Dr. Richard Chen, MD",
        remaining_doses=24,
        total_doses=30,
        is_active=True
    )
    med2 = MedicationSchedule(
        patient_id=patient.id,
        medication_name="Lisinopril",
        dosage="10 mg",
        frequency="Once daily",
        time_of_day="morning",
        instructions="Take in the morning with a full glass of water",
        purpose="Hypertension & Vascular Protection",
        prescribed_by="Dr. Richard Chen, MD",
        remaining_doses=26,
        total_doses=30,
        is_active=True
    )
    med3 = MedicationSchedule(
        patient_id=patient.id,
        medication_name="Atorvastatin",
        dosage="20 mg",
        frequency="Once daily",
        time_of_day="evening",
        instructions="Take in the evening with dinner",
        purpose="Cholesterol & Arterial Plaque Stabilization",
        prescribed_by="Dr. Richard Chen, MD",
        remaining_doses=28,
        total_doses=30,
        is_active=True
    )
    med4 = MedicationSchedule(
        patient_id=patient.id,
        medication_name="Aspirin Low-Dose",
        dosage="81 mg",
        frequency="Once daily",
        time_of_day="morning",
        instructions="Take with water after breakfast",
        purpose="Cardiovascular Thrombosis Prevention",
        prescribed_by="Dr. Richard Chen, MD",
        remaining_doses=25,
        total_doses=30,
        is_active=True
    )
    db.add_all([med1, med2, med3, med4])
    db.commit()
    db.refresh(med1)
    db.refresh(med2)

    # Seed today's adherence
    today_str = date.today().isoformat()
    db.add_all([
        MedicationAdherence(schedule_id=med1.id, patient_id=patient.id, date_str=today_str, time_slot="morning", status="taken"),
        MedicationAdherence(schedule_id=med2.id, patient_id=patient.id, date_str=today_str, time_slot="morning", status="taken")
    ])
    db.commit()

    # 6. Continuous Monitoring Daily Vitals (14 days)
    vitals_data = [
        (13, 142.0, 91.0, 136.0, 82.0, 81.2),
        (12, 139.0, 88.0, 132.0, 80.0, 81.0),
        (11, 141.0, 89.0, 130.0, 78.0, 80.8),
        (10, 136.0, 86.0, 128.0, 79.0, 80.6),
        (9,  134.0, 85.0, 125.0, 76.0, 80.4),
        (8,  132.0, 84.0, 122.0, 75.0, 80.1),
        (7,  130.0, 82.0, 120.0, 74.0, 80.0),
        (6,  129.0, 83.0, 119.0, 73.0, 79.8),
        (5,  127.0, 81.0, 116.0, 72.0, 79.6),
        (4,  128.0, 82.0, 117.0, 74.0, 79.5),
        (3,  125.0, 80.0, 114.0, 71.0, 79.3),
        (2,  126.0, 81.0, 115.0, 72.0, 79.2),
        (1,  124.0, 79.0, 112.0, 70.0, 79.0),
        (0,  125.0, 80.0, 114.0, 72.0, 79.1),
    ]

    for offset, sys_val, dia_val, glu_val, hr_val, wt_val in vitals_data:
        log_time = now - timedelta(days=offset, hours=2)
        db.add(VitalReading(
            patient_id=patient.id,
            metric_type="blood_pressure",
            value=sys_val,
            secondary_value=dia_val,
            unit="mmHg",
            context="morning_resting",
            notes="Logged after 5 min sitting quietly",
            logged_at=log_time,
            logged_by="patient"
        ))
        db.add(VitalReading(
            patient_id=patient.id,
            metric_type="blood_glucose",
            value=glu_val,
            unit="mg/dL",
            context="fasting",
            notes="Fasting blood sample before breakfast",
            logged_at=log_time,
            logged_by="patient"
        ))
        db.add(VitalReading(
            patient_id=patient.id,
            metric_type="heart_rate",
            value=hr_val,
            unit="bpm",
            context="resting",
            notes="Pulse check",
            logged_at=log_time,
            logged_by="patient"
        ))
        db.add(VitalReading(
            patient_id=patient.id,
            metric_type="weight",
            value=wt_val,
            unit="kg",
            context="morning_weigh_in",
            notes="Morning scale reading",
            logged_at=log_time,
            logged_by="patient"
        ))
    db.commit()

    # 7. Unified Health Records
    records = [
        HealthRecord(
            patient_id=patient.id,
            title="Comprehensive Metabolic Panel & Lipid Profile",
            category="lab",
            record_date=now - timedelta(days=14),
            provider_name="Metro Diagnostics Lab",
            facility="Quest Diagnostics Central",
            summary="Routine 3-month lipid panel and kidney function assessment.",
            key_findings="HbA1c decreased from 7.6% to 6.9%. Total Cholesterol 178 mg/dL (improved). eGFR 82 mL/min (stable).",
            tags="Labs,Metabolic,Lipids,HbA1c",
            file_type="pdf",
            file_url="/sample-reports/metabolic-panel.pdf",
            file_size_kb=345
        ),
        HealthRecord(
            patient_id=patient.id,
            title="Cardiology Consultation & Echocardiogram Report",
            category="consultation",
            record_date=now - timedelta(days=12),
            provider_name="Dr. Richard Chen, MD",
            facility="Metro Chronic Wellness Center",
            summary="10-week chronic hypertension follow-up and clinical plan adjustment.",
            key_findings="Resting BP 126/80 mmHg. Left ventricular function preserved with EF 58%. Medication adjusted to Metformin XR.",
            tags="Cardiology,Echo,Consultation,Prescription",
            file_type="pdf",
            file_url="/sample-reports/cardio-consult.pdf",
            file_size_kb=512
        ),
        HealthRecord(
            patient_id=patient.id,
            title="12-Lead Electrocardiogram (ECG / EKG)",
            category="imaging",
            record_date=now - timedelta(days=45),
            provider_name="Dr. Sarah Jenkins, MD",
            facility="Cardiovascular Imaging Associates",
            summary="Resting 12-lead ECG screening for chronic ischemic disease monitoring.",
            key_findings="Normal sinus rhythm with rate 72 bpm. PR interval 160ms. No acute ST-T wave abnormalities.",
            tags="Imaging,ECG,Cardiology",
            file_type="pdf",
            file_url="/sample-reports/ecg-report.pdf",
            file_size_kb=180
        ),
        HealthRecord(
            patient_id=patient.id,
            title="Prescription Schedule & Refill Authorization",
            category="prescription",
            record_date=now - timedelta(days=12),
            provider_name="Dr. Richard Chen, MD",
            facility="Metro Chronic Wellness Center",
            summary="Updated 90-day supply for Lisinopril, Metformin XR, and Atorvastatin.",
            key_findings="Refills authorized through February 2027 with adherence guidance.",
            tags="Prescription,Pharmacy,Refill",
            file_type="pdf",
            file_url="/sample-reports/prescription.pdf",
            file_size_kb=120
        )
    ]
    db.add_all(records)

    # 8. Smart Alerts: Phrased with 'attention may be needed'
    alerts = [
        SmartAlert(
            patient_id=patient.id,
            severity="warning",
            metric_type="blood_pressure",
            title="Attention may be needed: Elevated Evening Systolic Reading",
            message="Your logged reading of 142/91 mmHg is slightly above your target (Target <130/80 (Dr. Chen, 12 Mar)). Attention may be needed; please rest for 15 minutes and log a confirmation reading.",
            measured_value="142 / 91 mmHg",
            clinician_target="Target <130/80 (Dr. Chen, 12 Mar)",
            is_acknowledged=False,
            caregiver_notified=False,
            created_at=now - timedelta(days=1, hours=4)
        ),
        SmartAlert(
            patient_id=patient.id,
            severity="critical",
            metric_type="blood_pressure",
            title="Attention may be needed: Reading Exceeded Target Threshold",
            message="Systolic measurement reached 148 mmHg during initial titration. Attention may be needed; caregiver notified for routine check-in.",
            measured_value="148 / 94 mmHg",
            clinician_target="Target <130/80 (Dr. Chen, 12 Mar)",
            is_acknowledged=True,
            caregiver_notified=True,
            created_at=now - timedelta(days=13, hours=8)
        )
    ]
    db.add_all(alerts)
    db.commit()

    print("[OK] Seed complete! Seeded Patient Arthur and Caregiver Kelly. Doctor role removed.")
    db.close()

if __name__ == "__main__":
    seed_database()
