import sys
import os
from datetime import datetime, date, timedelta
from backend.database import SessionLocal, Base, engine
from backend.models import (
    User, CaregiverConsent, Consultation, ConsultationMedication,
    ConsultationVital, HealthRecord, VitalReading, MedicationSchedule,
    MedicationAdherence, AlertRule, SmartAlert, DoctorShareToken
)
from backend.routers import (
    auth_routes, caregiver_routes, consultations_routes,
    medications_routes, records_routes, targets_routes,
    vitals_routes, alerts_routes
)
from backend.schemas import (
    UserLogin, UserCreate, ConsentUpdate, HealthRecordCreate,
    VitalReadingCreate, MedicationAdherenceLog, AlertRuleUpdate,
    SeniorModeTriggerAlert, DoctorShareCreate
)
from backend.auth import create_access_token, verify_password, get_password_hash

def run_tests():
    print("=== STARTING BACKEND TESTS ===")
    db = SessionLocal()
    errors = []

    try:
        # 1. Check Seeded Users
        patient = db.query(User).filter(User.role == "patient").first()
        caregiver = db.query(User).filter(User.role == "caregiver").first()
        print(f"Patient: {patient.full_name} ({patient.email})")
        print(f"Caregiver: {caregiver.full_name} ({caregiver.email})")
        assert patient is not None, "Missing seeded patient"
        assert caregiver is not None, "Missing seeded caregiver"

        # 2. Test Auth Routes
        # 2a. Login
        login_res = auth_routes.login(UserLogin(email="patient@carechrono.com", password="Patient123!"), db=db)
        assert "access_token" in login_res, "Login failed to return access_token"
        print("[OK] Auth: Login successful")

        # 2b. Demo Switch
        switch_p = auth_routes.switch_demo_role("patient", db=db)
        switch_c = auth_routes.switch_demo_role("caregiver", db=db)
        assert switch_p["user"].role == "patient"
        assert switch_c["user"].role == "caregiver"
        print("[OK] Auth: Demo role switch successful")

        # 2c. Toggle Senior Mode
        toggled = auth_routes.toggle_senior_mode(current_user=patient, db=db)
        initial_mode = toggled.is_senior_mode
        # Toggle back
        auth_routes.toggle_senior_mode(current_user=patient, db=db)
        print("[OK] Auth: Toggle senior mode successful")

        # 3. Test Caregiver Routes
        consents = caregiver_routes.get_patient_consents(current_user=patient, db=db)
        assert len(consents) > 0, "No caregiver consents found for patient"
        print(f"[OK] Caregiver: Got {len(consents)} consents")

        # Caregiver view
        cg_consents = caregiver_routes.get_patient_consents(current_user=caregiver, db=db)
        assert len(cg_consents) > 0, "No consents found when querying as caregiver"
        print(f"[OK] Caregiver: Query as caregiver returned {len(cg_consents)} records")

        cg_patients = caregiver_routes.get_caregiver_patients(current_user=caregiver, db=db)
        assert len(cg_patients) > 0, "No patients found for caregiver"
        print(f"[OK] Caregiver: Caregiver has {len(cg_patients)} consented patients")

        # 4. Test Consultations Routes
        consults = consultations_routes.get_consultations(patient_id=patient.id, current_user=patient, db=db)
        assert len(consults) >= 2, f"Expected at least 2 consultations, got {len(consults)}"
        print(f"[OK] Consultations: Found {len(consults)} consultations")

        # Test Compare
        compare_res = consultations_routes.compare_consultations(
            c1_id=consults[0].id, c2_id=consults[1].id, patient_id=patient.id,
            current_user=patient, db=db
        )
        assert compare_res.days_between >= 0
        assert len(compare_res.diff_summary) > 0
        print(f"[OK] Consultations: Compare successful, {len(compare_res.diff_summary)} diff items, {compare_res.improved_count} improved")

        # Test 24-hr Share Link
        share_res = consultations_routes.create_doctor_share_link(
            payload=DoctorShareCreate(notes="Testing 24h link"),
            current_user=patient, db=db
        )
        assert share_res.token is not None
        print(f"[OK] Consultations: Created share link token {share_res.token}")

        shared_view = consultations_routes.get_shared_doctor_view(token=share_res.token, db=db)
        assert shared_view["status"] == "active"
        print(f"[OK] Consultations: Shared view loaded for doctor")

        # 5. Test Medications Routes
        meds = medications_routes.get_medications(patient_id=patient.id, current_user=patient, db=db)
        assert len(meds) > 0
        print(f"[OK] Medications: Retrieved {len(meds)} active medications")

        # Test Adherence Logging
        adh_res = medications_routes.log_adherence(
            payload=MedicationAdherenceLog(schedule_id=meds[0].id, status="taken"),
            current_user=patient, db=db
        )
        assert adh_res["status"] == "success"
        print("[OK] Medications: Log adherence successful")

        # Test Health Bloom Status
        bloom = medications_routes.get_health_bloom_status(patient_id=patient.id, current_user=patient, db=db)
        assert bloom.total_petals == 5
        print(f"[OK] Medications: Health Bloom status: {bloom.petals_earned}/5 petals, stage: {bloom.bloom_stage}")

        # 6. Test Records Routes
        records = records_routes.get_records(category="all", patient_id=patient.id, current_user=patient, db=db)
        assert len(records) > 0
        print(f"[OK] Records: Retrieved {len(records)} records")

        rec_detail = records_routes.get_record_detail(record_id=records[0].id, current_user=patient, db=db)
        assert rec_detail.id == records[0].id
        print(f"[OK] Records: Detail view for record #{rec_detail.id} works")

        # 7. Test Targets & Safety Floors
        floors = targets_routes.get_safety_floors()
        assert "blood_pressure" in floors["safety_floors"]
        assert "blood_glucose" in floors["safety_floors"]
        print("[OK] Targets: Safety floors verified")

        targets_list = targets_routes.get_targets(patient_id=patient.id, current_user=patient, db=db)
        assert len(targets_list) > 0
        print(f"[OK] Targets: Retrieved {len(targets_list)} targets")

        # 8. Test Vitals & Alerts
        trends = vitals_routes.get_vitals_trends(patient_id=patient.id, current_user=patient, db=db)
        assert len(trends) == 4
        print(f"[OK] Vitals: Got {len(trends)} metric trends")

        history = vitals_routes.get_vitals_history(metric_type="blood_pressure", patient_id=patient.id, current_user=patient, db=db)
        assert len(history) > 0
        print(f"[OK] Vitals: Got {len(history)} blood pressure readings")

        # Test log vital reading (triggering critical safety floor)
        crit_reading = vitals_routes.log_vital_reading(
            reading_in=VitalReadingCreate(
                metric_type="blood_pressure",
                value=185.0,
                secondary_value=122.0,
                unit="mmHg",
                context="emergency_test"
            ),
            current_user=patient, db=db
        )
        print(f"[OK] Vitals: Logged critical BP reading #{crit_reading.id}")

        # Check if critical alert was generated
        alerts_list = alerts_routes.get_alerts(patient_id=patient.id, current_user=patient, db=db)
        assert len(alerts_list) > 0
        assert any(a.severity == "critical" for a in alerts_list)
        print(f"[OK] Alerts: Found {len(alerts_list)} alerts, critical alert triggered")

        # Test Acknowledge Alert
        ack_res = alerts_routes.acknowledge_alert(alert_id=alerts_list[0].id, current_user=patient, db=db)
        assert ack_res.is_acknowledged == True
        print(f"[OK] Alerts: Alert #{ack_res.id} acknowledged")

        # Test Senior Emergency
        emerg_res = alerts_routes.trigger_senior_emergency(
            payload=SeniorModeTriggerAlert(alert_type="emergency_call"),
            current_user=patient, db=db
        )
        assert emerg_res["status"] == "success"
        print(f"[OK] Alerts: Senior emergency alert triggered #{emerg_res['alert_id']}")

        print("=== ALL 24 TESTS PASSED WITH ZERO ERRORS! ===")

    except Exception as e:
        import traceback
        print(f"[ERROR] Test failed: {e}")
        traceback.print_exc()
        errors.append(str(e))
    finally:
        db.close()

    if errors:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
