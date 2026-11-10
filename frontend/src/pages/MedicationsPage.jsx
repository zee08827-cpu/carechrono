import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Pill, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Info, 
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const MedicationsPage = () => {
  const { authFetch } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justTakenId, setJustTakenId] = useState(null);

  const fetchMeds = async () => {
    try {
      const res = await authFetch('/api/medications');
      if (res.ok) {
        const data = await res.json();
        setMedications(data);
      }
    } catch (e) {
      console.error('Error fetching meds:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleToggleTake = async (med) => {
    const nextStatus = med.taken_today ? 'missed' : 'taken';
    try {
      const res = await authFetch('/api/medications/log-adherence', {
        method: 'POST',
        body: JSON.stringify({
          schedule_id: med.id,
          status: nextStatus,
          time_slot: med.time_of_day
        })
      });
      if (res.ok) {
        if (nextStatus === 'taken') {
          setJustTakenId(med.id);
          setTimeout(() => setJustTakenId(null), 2500);
        }
        fetchMeds();
      }
    } catch (e) {
      console.error('Error logging adherence:', e);
    }
  };

  const morningMeds = medications.filter(m => m.time_of_day === 'morning');
  const eveningMeds = medications.filter(m => m.time_of_day === 'evening' || m.time_of_day === 'bedtime');

  const takenCount = medications.filter(m => m.taken_today).length;
  const adherenceRate = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header with Adherence Metric */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
            <Pill className="w-6 h-6 text-teal-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-teal-dark">Medication Schedule & Guidance</h1>
            <p className="text-sm text-teal-dark/70">
              Personalized dosing reminders, clinical purpose, and food-intake guidelines.
            </p>
          </div>
        </div>

        {/* Today's Adherence Pill */}
        <div className="flex items-center gap-3 bg-mint/40 px-4 py-2.5 rounded-full border border-mint">
          <Sparkles className="w-5 h-5 text-teal-dark" />
          <div className="text-xs">
            <span className="font-bold text-teal-dark">Today's Adherence: </span>
            <span className="font-black text-teal-dark text-sm">{takenCount}/{medications.length} Doses ({adherenceRate}%)</span>
          </div>
        </div>
      </div>

      {justTakenId && (
        <div className="p-4 rounded-2xl bg-mint text-teal-dark font-bold text-xs flex items-center gap-2 shadow-soft animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-dark" />
          <span>Dose confirmed taken! Petal recorded in your Health Bloom flower.</span>
        </div>
      )}

      {/* Morning Section */}
      <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-mint/60 flex items-center justify-center">
              <Clock className="w-4 h-4 text-teal-dark" />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal-dark">Morning Routine</h2>
              <span className="text-[11px] text-teal-dark/60">Around breakfast (8:00 AM)</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-dark/70 bg-canvas-subtle px-3 py-1 rounded-full">
            {morningMeds.filter(m => m.taken_today).length}/{morningMeds.length} Taken
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {morningMeds.map((med) => (
            <div
              key={med.id}
              className={`p-4 rounded-2xl border transition-all ${
                med.taken_today 
                  ? 'bg-mint-light/40 border-mint' 
                  : 'bg-canvas-subtle/50 border-teal-dark/10 hover:border-teal-dark/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-teal-dark text-base">{med.medication_name}</span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-teal-dark/10 text-teal-dark">
                      {med.dosage}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-teal-dark/70 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-teal-dark/50" />
                    {med.purpose}
                  </p>
                </div>

                {/* Take Dose Checkbox Button */}
                <button
                  onClick={() => handleToggleTake(med)}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-pill ${
                    med.taken_today
                      ? 'bg-mint text-teal-dark border border-teal-dark/20'
                      : 'bg-teal-dark text-white hover:bg-teal-light'
                  }`}
                >
                  {med.taken_today ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-dark stroke-[2.5]" />
                      <span>Taken</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-white" />
                      <span>Mark Taken</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dosing Guidance Pill */}
              <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-teal-dark/5 text-xs text-teal-dark/90 flex items-center gap-2">
                <span className="font-semibold text-teal-dark">Guidance:</span>
                <span>{med.instructions}</span>
              </div>

              {/* Supply & Prescribing Doctor */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal-dark/60 pt-2 border-t border-teal-dark/5">
                <span>Prescribed by {med.prescribed_by}</span>
                <span className={`font-semibold ${med.remaining_doses <= 5 ? 'text-coral-dark' : 'text-teal-dark'}`}>
                  {med.remaining_doses} doses remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evening Section */}
      <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-soft flex items-center justify-center">
              <Clock className="w-4 h-4 text-teal-dark" />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal-dark">Evening & Dinner Routine</h2>
              <span className="text-[11px] text-teal-dark/60">Around dinner (7:00 PM)</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-dark/70 bg-canvas-subtle px-3 py-1 rounded-full">
            {eveningMeds.filter(m => m.taken_today).length}/{eveningMeds.length} Taken
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eveningMeds.map((med) => (
            <div
              key={med.id}
              className={`p-4 rounded-2xl border transition-all ${
                med.taken_today 
                  ? 'bg-mint-light/40 border-mint' 
                  : 'bg-canvas-subtle/50 border-teal-dark/10 hover:border-teal-dark/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-teal-dark text-base">{med.medication_name}</span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-teal-dark/10 text-teal-dark">
                      {med.dosage}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-teal-dark/70 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-teal-dark/50" />
                    {med.purpose}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleTake(med)}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-pill ${
                    med.taken_today
                      ? 'bg-mint text-teal-dark border border-teal-dark/20'
                      : 'bg-teal-dark text-white hover:bg-teal-light'
                  }`}
                >
                  {med.taken_today ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-dark stroke-[2.5]" />
                      <span>Taken</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-white" />
                      <span>Mark Taken</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-teal-dark/5 text-xs text-teal-dark/90 flex items-center gap-2">
                <span className="font-semibold text-teal-dark">Guidance:</span>
                <span>{med.instructions}</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal-dark/60 pt-2 border-t border-teal-dark/5">
                <span>Prescribed by {med.prescribed_by}</span>
                <span className="font-semibold text-teal-dark">
                  {med.remaining_doses} doses remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
