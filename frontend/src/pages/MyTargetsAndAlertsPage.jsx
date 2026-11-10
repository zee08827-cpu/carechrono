import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Target, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Edit3, 
  Lock,
  Info,
  Calendar,
  User,
  Shield,
  RotateCcw
} from 'lucide-react';

export const MyTargetsAndAlertsPage = () => {
  const { authFetch, user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        authFetch('/api/targets'),
        authFetch('/api/alerts')
      ]);
      if (tRes.ok) setTargets(await tRes.json());
      if (aRes.ok) setAlerts(await aRes.json());
    } catch (e) {
      console.error('Error fetching targets/alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      const res = await authFetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Error acknowledging alert:', e);
    }
  };

  const handleStartEdit = (t) => {
    setEditingId(t.id);
    setEditValues({
      target_max: t.target_max,
      warning_max: t.warning_max,
      set_by_doctor_name: t.set_by_doctor_name || 'Dr. Chen',
      set_on: t.set_on || new Date().toISOString().split('T')[0],
      notes: t.notes || ''
    });
  };

  const handleSaveTarget = async (ruleId) => {
    try {
      const res = await authFetch(`/api/targets/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editValues,
          source: 'doctor_prescribed'
        })
      });
      if (res.ok) {
        setFeedback('Target updated from your doctor.');
        setTimeout(() => setFeedback(''), 3000);
        setEditingId(null);
        fetchData();
      }
    } catch (e) {
      console.error('Failed to update target:', e);
    }
  };

  const handleResetGuidelines = async () => {
    if (!window.confirm('Reset all targets to general guideline defaults?')) return;
    try {
      const res = await authFetch('/api/targets/reset-to-guidelines', { method: 'POST' });
      if (res.ok) {
        setFeedback('Targets reset to general guidelines.');
        setTimeout(() => setFeedback(''), 3000);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner: "Targets set by you and your doctor" */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
              <Target className="w-6 h-6 text-teal-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-dark">My Targets & Alerts</h1>
              <p className="text-sm font-semibold text-teal-dark/80 mt-0.5">
                Targets set by you and your doctor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetGuidelines}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-canvas-subtle hover:bg-canvas-subtle/80 text-teal-dark/80 text-xs font-semibold border border-teal-dark/15 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Guidelines</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-mint text-teal-dark rounded-2xl text-xs font-bold flex items-center gap-2 shadow-soft">
          <CheckCircle2 className="w-4 h-4 text-teal-dark" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SECTION 1: Fixed Non-Editable Safety Floor */}
      <div className="bg-teal-dark text-white rounded-card p-6 shadow-soft relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-mint/20 text-mint flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-mint" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">Fixed Safety Floor</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-mint px-2.5 py-0.5 rounded-full border border-mint/30">
                Non-Editable Safety Guardrail
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              To ensure your physical safety, critical alerts are permanently hardcoded for high-risk zones. 
              <strong> You cannot edit, loosen or disable these safety floors:</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs">
                <span className="font-bold text-mint block">Blood Pressure Safety Floor</span>
                <span className="font-extrabold text-sm">Systolic ≥ 180 or Diastolic ≥ 120 mmHg</span>
                <span className="text-[11px] text-white/70 block mt-0.5">Always triggers high-priority alert & caregiver notification</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs">
                <span className="font-bold text-mint block">Blood Glucose Safety Floor</span>
                <span className="font-extrabold text-sm">Fasting &lt; 70 or &gt; 250 mg/dL</span>
                <span className="text-[11px] text-white/70 block mt-0.5">Severe hypo/hyperglycemia immediate warning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Active Safety Alerts */}
      <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-dark" />
            <h2 className="text-lg font-bold text-teal-dark">Active Safety Alerts</h2>
          </div>
          <span className="text-xs bg-canvas-subtle text-teal-dark/70 px-3 py-1 rounded-full font-bold">
            {alerts.filter(a => !a.is_acknowledged).length} Pending
          </span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-xs text-teal-dark/60 py-4 text-center">
              No active alerts. All measurements are within your target zones.
            </p>
          ) : (
            alerts.map((al) => {
              const isCritical = al.severity === 'critical';
              return (
                <div
                  key={al.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCritical
                      ? 'bg-coral-critical/10 border-coral-critical/40'
                      : 'bg-coral/10 border-coral/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-0.5 ${
                        isCritical ? 'bg-coral-critical text-white' : 'bg-coral text-teal-dark'
                      }`}>
                        {isCritical ? (
                          <AlertTriangle className="w-4 h-4 text-white" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-teal-dark" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCritical ? 'bg-coral-critical text-white' : 'bg-coral text-teal-dark font-bold'
                          }`}>
                            {isCritical ? 'CRITICAL ATTENTION' : 'ATTENTION MAY BE NEEDED'}
                          </span>
                          <span className="text-xs font-bold text-teal-dark">
                            Measured: {al.measured_value}
                          </span>
                          {al.caregiver_notified && (
                            <span className="text-[10px] font-bold bg-white text-teal-dark px-2 py-0.5 rounded-full border border-teal-dark/10">
                              Caregiver Notified
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-teal-dark">{al.title}</h4>
                        <p className="text-xs text-teal-dark/85 leading-relaxed">{al.message}</p>
                        <p className="text-[11px] text-teal-dark/60 font-semibold">{al.clinician_target}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {al.is_acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark/60 bg-white/70 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-mint-dark" /> Acknowledged
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(al.id)}
                          className="px-4 py-2 bg-teal-dark hover:bg-teal-light text-white text-xs font-bold rounded-full shadow-pill transition-all"
                        >
                          Mark Acknowledged
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: Targets Configuration (Patient-owned) */}
      <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
        <div className="border-b border-teal-dark/10 pb-3">
          <h2 className="text-lg font-bold text-teal-dark">Your Care Plan Targets</h2>
          <p className="text-xs text-teal-dark/70 mt-0.5">
            You can enter targets given to you by your doctor, or use standard general health guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((t) => {
            const isEditing = editingId === t.id;
            const isDoctorPrescribed = t.source === 'doctor_prescribed' && t.set_by_doctor_name;

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-canvas-subtle/70 border border-teal-dark/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-teal-dark text-base capitalize">
                      {t.metric_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold bg-white text-teal-dark px-2 py-0.5 rounded-full border border-teal-dark/10">
                      {t.unit}
                    </span>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-dark hover:text-teal-light bg-white px-2.5 py-1 rounded-full border border-teal-dark/15 shadow-sm"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Target
                    </button>
                  )}
                </div>

                {/* Source Badge */}
                <div>
                  {isDoctorPrescribed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-mint text-teal-dark px-2.5 py-0.5 rounded-full shadow-pill">
                      Set with {t.set_by_doctor_name} {t.set_on ? `(${t.set_on})` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                      General guideline, not personalised
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-teal-dark/70 mb-1">Target Max ({t.unit})</label>
                        <input
                          type="number"
                          value={editValues.target_max}
                          onChange={(e) => setEditValues({ ...editValues, target_max: parseFloat(e.target.value) })}
                          className="w-full p-2 rounded-xl border border-teal-dark/20 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-teal-dark/70 mb-1">Warning Above ({t.unit})</label>
                        <input
                          type="number"
                          value={editValues.warning_max}
                          onChange={(e) => setEditValues({ ...editValues, warning_max: parseFloat(e.target.value) })}
                          className="w-full p-2 rounded-xl border border-teal-dark/20 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-teal-dark/70 mb-1">Doctor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Chen"
                          value={editValues.set_by_doctor_name}
                          onChange={(e) => setEditValues({ ...editValues, set_by_doctor_name: e.target.value })}
                          className="w-full p-2 rounded-xl border border-teal-dark/20 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-teal-dark/70 mb-1">Date Given by Doctor</label>
                        <input
                          type="text"
                          placeholder="e.g. 12 Mar"
                          value={editValues.set_on}
                          onChange={(e) => setEditValues({ ...editValues, set_on: e.target.value })}
                          className="w-full p-2 rounded-xl border border-teal-dark/20 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-teal-dark/70 mb-1">Doctor's Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Recommended by Dr. Chen during follow-up"
                        value={editValues.notes}
                        onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                        className="w-full p-2 rounded-xl border border-teal-dark/20 text-xs font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSaveTarget(t.id)}
                        className="px-4 py-1.5 bg-teal-dark text-white text-xs font-bold rounded-full shadow-pill"
                      >
                        Save Target
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="bg-mint/40 p-2.5 rounded-xl border border-mint">
                        <span className="text-[10px] font-bold text-teal-dark/70 block uppercase">Target Zone</span>
                        <span className="text-xs font-black text-teal-dark">
                          &lt; {t.target_max} {t.unit}
                        </span>
                      </div>
                      <div className="bg-coral/20 p-2.5 rounded-xl border border-coral/30">
                        <span className="text-[10px] font-bold text-coral-dark block uppercase">Warning Zone</span>
                        <span className="text-xs font-black text-teal-dark">
                          &gt; {t.warning_max} {t.unit}
                        </span>
                      </div>
                    </div>

                    {t.notes && (
                      <p className="text-xs text-teal-dark/80 bg-white p-3 rounded-xl border border-teal-dark/5">
                        {t.notes}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
