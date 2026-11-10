import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Pill, 
  Activity, 
  FileText, 
  PhoneCall, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  AlertTriangle,
  X,
  Volume2
} from 'lucide-react';

export const SeniorModeView = () => {
  const { toggleSeniorMode, authFetch, user } = useAuth();
  const [activeSection, setActiveSection] = useState(null); // 'meds', 'vitals', 'doctor', 'emergency'
  const [meds, setMeds] = useState([]);
  const [systolic, setSystolic] = useState('125');
  const [diastolic, setDiastolic] = useState('80');
  const [consultation, setConsultation] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [emergencySent, setEmergencySent] = useState(false);

  useEffect(() => {
    // Load senior simplified data
    const loadSeniorData = async () => {
      try {
        const [mRes, cRes] = await Promise.all([
          authFetch('/api/medications'),
          authFetch('/api/consultations')
        ]);
        if (mRes.ok) setMeds(await mRes.json());
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.length > 0) setConsultation(cData[0]);
        }
      } catch (e) {
        console.error('Error loading senior mode data:', e);
      }
    };
    loadSeniorData();
  }, []);

  const handleToggleMed = async (med) => {
    const next = med.taken_today ? 'missed' : 'taken';
    try {
      const res = await authFetch('/api/medications/log-adherence', {
        method: 'POST',
        body: JSON.stringify({ schedule_id: med.id, status: next })
      });
      if (res.ok) {
        setMeds(meds.map(m => m.id === med.id ? { ...m, taken_today: !m.taken_today } : m));
        setFeedback(`Checked: ${med.medication_name}`);
        setTimeout(() => setFeedback(''), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVital = async () => {
    try {
      const res = await authFetch('/api/vitals', {
        method: 'POST',
        body: JSON.stringify({
          metric_type: 'blood_pressure',
          value: parseFloat(systolic),
          secondary_value: parseFloat(diastolic),
          unit: 'mmHg',
          context: 'senior_mode_entry'
        })
      });
      if (res.ok) {
        setFeedback('Blood pressure reading saved!');
        setTimeout(() => {
          setFeedback('');
          setActiveSection(null);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmergencyCall = async () => {
    try {
      const res = await authFetch('/api/alerts/senior-emergency', {
        method: 'POST',
        body: JSON.stringify({ alert_type: 'emergency_call', notes: 'Triggered from Senior Mode 1-Tap' })
      });
      if (res.ok) {
        setEmergencySent(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FCFB] text-[#0F4953] p-4 sm:p-8 font-sans">
      
      {/* Top Header: Simple High-Contrast Bar */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pb-6 border-b-4 border-[#0F4953]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F4953]">
            CareChrono Senior
          </h1>
          <p className="text-xl font-bold text-[#0F4953]/80">
            Hello, {user?.full_name?.split(' ')[0] || 'Arthur'}
          </p>
        </div>

        <button
          onClick={toggleSeniorMode}
          className="px-5 py-3 bg-[#0F4953] text-white text-lg font-black rounded-2xl hover:bg-[#1B6A78] transition-all"
          aria-label="Switch back to standard mode"
        >
          Standard View
        </button>
      </div>

      {feedback && (
        <div className="max-w-2xl mx-auto my-4 p-4 bg-[#CBF5EF] text-[#0F4953] text-2xl font-black rounded-2xl text-center border-4 border-[#0F4953]">
          {feedback}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-2xl mx-auto py-8">
        
        {/* If no sub-section opened: SHOW 4 HUGE FULL-WIDTH BUTTONS */}
        {!activeSection ? (
          <div className="space-y-6">
            
            {/* Button 1: My Medicines */}
            <button
              onClick={() => setActiveSection('meds')}
              className="w-full py-8 px-6 bg-[#0F4953] text-white rounded-3xl text-left flex items-center justify-between shadow-none hover:bg-[#1B6A78] transition-all active:scale-[0.98] border-4 border-[#0F4953]"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#CBF5EF] text-[#0F4953] flex items-center justify-center font-black">
                  <Pill className="w-10 h-10 text-[#0F4953]" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">1. My Medicines</h2>
                  <p className="text-lg font-bold text-[#CBF5EF] mt-1">
                    {meds.filter(m => m.taken_today).length} of {meds.length} pills taken today
                  </p>
                </div>
              </div>
              <span className="text-4xl font-black">→</span>
            </button>

            {/* Button 2: Log Reading */}
            <button
              onClick={() => setActiveSection('vitals')}
              className="w-full py-8 px-6 bg-[#0F4953] text-white rounded-3xl text-left flex items-center justify-between shadow-none hover:bg-[#1B6A78] transition-all active:scale-[0.98] border-4 border-[#0F4953]"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#CBF5EF] text-[#0F4953] flex items-center justify-center font-black">
                  <Activity className="w-10 h-10 text-[#0F4953]" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">2. Log Health Reading</h2>
                  <p className="text-lg font-bold text-[#CBF5EF] mt-1">
                    Enter today's Blood Pressure
                  </p>
                </div>
              </div>
              <span className="text-4xl font-black">→</span>
            </button>

            {/* Button 3: Doctor Notes */}
            <button
              onClick={() => setActiveSection('doctor')}
              className="w-full py-8 px-6 bg-[#0F4953] text-white rounded-3xl text-left flex items-center justify-between shadow-none hover:bg-[#1B6A78] transition-all active:scale-[0.98] border-4 border-[#0F4953]"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#CBF5EF] text-[#0F4953] flex items-center justify-center font-black">
                  <FileText className="w-10 h-10 text-[#0F4953]" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">3. Doctor's Advice</h2>
                  <p className="text-lg font-bold text-[#CBF5EF] mt-1">
                    What Dr. Chen advised at last visit
                  </p>
                </div>
              </div>
              <span className="text-4xl font-black">→</span>
            </button>

            {/* Button 4: Emergency / Call Caregiver (CORAL ACCENT) */}
            <button
              onClick={() => setActiveSection('emergency')}
              className="w-full py-8 px-6 bg-[#F98E6E] text-[#0F4953] rounded-3xl text-left flex items-center justify-between shadow-none hover:bg-[#FDBDAA] transition-all active:scale-[0.98] border-4 border-[#C2410C]"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#0F4953] text-white flex items-center justify-center font-black">
                  <PhoneCall className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">4. Call Caregiver Kelly</h2>
                  <p className="text-lg font-black text-[#0F4953] mt-1">
                    Instant 1-Tap Family Notification
                  </p>
                </div>
              </div>
              <span className="text-4xl font-black">→</span>
            </button>

          </div>
        ) : (
          /* SUB-PAGE VIEWS WITH LARGE HIGH-CONTRAST TEXT */
          <div className="space-y-6">
            
            {/* Back button */}
            <button
              onClick={() => setActiveSection(null)}
              className="inline-flex items-center gap-3 px-6 py-4 bg-[#0F4953] text-white rounded-2xl text-xl font-black hover:bg-[#1B6A78] mb-4"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3]" />
              <span>Back to Main Menu</span>
            </button>

            {/* Sub-section 1: Medicines */}
            {activeSection === 'meds' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-[#0F4953]">Your Daily Medicines:</h2>
                {meds.map((m) => (
                  <div
                    key={m.id}
                    className={`p-6 rounded-3xl border-4 transition-all flex items-center justify-between gap-4 ${
                      m.taken_today
                        ? 'bg-[#CBF5EF] border-[#0F4953]'
                        : 'bg-white border-[#0F4953]'
                    }`}
                  >
                    <div>
                      <h3 className="text-2xl font-black text-[#0F4953]">{m.medication_name} ({m.dosage})</h3>
                      <p className="text-lg font-bold text-[#0F4953]/80 mt-1">{m.instructions}</p>
                      <span className="text-sm font-black uppercase text-[#0F4953] bg-white px-3 py-1 rounded-full border-2 border-[#0F4953] inline-block mt-2">
                        {m.time_of_day} Dose
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleMed(m)}
                      className={`px-6 py-4 rounded-2xl text-xl font-black flex items-center gap-2 border-3 ${
                        m.taken_today
                          ? 'bg-[#0F4953] text-[#CBF5EF]'
                          : 'bg-white text-[#0F4953] border-4 border-[#0F4953]'
                      }`}
                    >
                      {m.taken_today ? (
                        <>
                          <CheckCircle2 className="w-7 h-7 stroke-[3]" /> Taken
                        </>
                      ) : (
                        'Tap to Take'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-section 2: Log Reading */}
            {activeSection === 'vitals' && (
              <div className="bg-white p-6 rounded-3xl border-4 border-[#0F4953] space-y-6">
                <h2 className="text-2xl font-black text-[#0F4953]">Enter Your Blood Pressure:</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xl font-black text-[#0F4953] mb-2">
                      Top Number (Systolic)
                    </label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full p-4 rounded-2xl border-4 border-[#0F4953] text-3xl font-black text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-black text-[#0F4953] mb-2">
                      Bottom Number (Diastolic)
                    </label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full p-4 rounded-2xl border-4 border-[#0F4953] text-3xl font-black text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {['120/80', '125/82', '130/85', '138/88'].map(preset => {
                    const [s, d] = preset.split('/');
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => { setSystolic(s); setDiastolic(d); }}
                        className="px-4 py-2 bg-[#CBF5EF] text-[#0F4953] text-lg font-black rounded-xl border-2 border-[#0F4953]"
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleSaveVital}
                  className="w-full py-6 bg-[#0F4953] text-white text-2xl font-black rounded-2xl hover:bg-[#1B6A78]"
                >
                  Save Reading Now
                </button>
              </div>
            )}

            {/* Sub-section 3: Doctor's Advice */}
            {activeSection === 'doctor' && consultation && (
              <div className="bg-white p-6 rounded-3xl border-4 border-[#0F4953] space-y-4">
                <h2 className="text-2xl font-black text-[#0F4953]">Dr. Richard Chen's Latest Notes:</h2>
                
                <div className="p-4 bg-[#CBF5EF] rounded-2xl border-2 border-[#0F4953]">
                  <span className="text-sm font-black uppercase text-[#0F4953]">Visit Assessment:</span>
                  <p className="text-xl font-bold text-[#0F4953] mt-1">{consultation.clinical_assessment}</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border-2 border-[#0F4953]">
                  <span className="text-sm font-black uppercase text-[#0F4953]">What You Should Do:</span>
                  <p className="text-xl font-bold text-[#0F4953] mt-1">{consultation.plan_notes}</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border-2 border-[#0F4953]">
                  <span className="text-sm font-black uppercase text-[#0F4953]">Diet & Walking Advice:</span>
                  <p className="text-xl font-bold text-[#0F4953] mt-1">{consultation.lifestyle_advice}</p>
                </div>
              </div>
            )}

            {/* Sub-section 4: Emergency Call */}
            {activeSection === 'emergency' && (
              <div className="bg-white p-8 rounded-3xl border-4 border-[#C2410C] text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-[#F98E6E] text-[#0F4953] flex items-center justify-center mx-auto">
                  <PhoneCall className="w-12 h-12 text-[#0F4953]" />
                </div>

                {emergencySent ? (
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-[#0F4953]">
                      Call Signal Sent to Kelly!
                    </h2>
                    <p className="text-xl font-bold text-[#0F4953]/80">
                      Kelly Johnson was notified on her phone. She is checking in right now.
                    </p>
                    <p className="text-lg font-bold text-coral-critical">
                      If you are feeling unwell or have severe chest pain, please dial 911 immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-[#0F4953]">
                      Notify Kelly Johnson Now?
                    </h2>
                    <p className="text-xl font-bold text-[#0F4953]/80">
                      This will send an instant high-priority notification to your daughter Kelly's phone.
                    </p>
                    <button
                      onClick={handleEmergencyCall}
                      className="w-full py-6 bg-[#C2410C] text-white text-2xl font-black rounded-2xl hover:bg-[#9A3412] active:scale-95 transition-transform"
                    >
                      YES, NOTIFY KELLY NOW
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Safety Notice in Senior Mode */}
      <div className="max-w-2xl mx-auto pt-12 pb-8 text-center text-sm font-bold text-[#0F4953]/70">
        CareChrono Senior Mode • High Contrast Accessibility • Not a substitute for 911 emergency services
      </div>

    </div>
  );
};
