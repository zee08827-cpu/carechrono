import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GitCompare, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Stethoscope, 
  Sparkles,
  Pill,
  Activity,
  FileText,
  Clock
} from 'lucide-react';

export const ConsultationCompare = () => {
  const { authFetch } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [selectedC1, setSelectedC1] = useState('');
  const [selectedC2, setSelectedC2] = useState('');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load consultations list
  useEffect(() => {
    const fetchConsults = async () => {
      try {
        const res = await authFetch('/api/consultations');
        if (res.ok) {
          const data = await res.json();
          setConsultations(data);
          if (data.length >= 2) {
            setSelectedC1(data[0].id);
            setSelectedC2(data[1].id);
          }
        }
      } catch (e) {
        console.error('Error fetching consultations:', e);
      }
    };
    fetchConsults();
  }, []);

  // Fetch comparison diff when selection changes
  useEffect(() => {
    if (!selectedC1 || !selectedC2) return;
    const fetchDiff = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/consultations/compare?c1_id=${selectedC1}&c2_id=${selectedC2}`);
        if (res.ok) {
          const data = await res.json();
          setDiffData(data);
        }
      } catch (e) {
        console.error('Error comparing consultations:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDiff();
  }, [selectedC1, selectedC2]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
              <GitCompare className="w-6 h-6 text-teal-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-dark">Consultation Comparison</h1>
              <p className="text-sm text-teal-dark/70">
                Understand what changed between doctor visits: medications, vitals, and care plans.
              </p>
            </div>
          </div>

          {/* Visit Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-canvas-subtle p-2 rounded-2xl border border-teal-dark/10">
              <Calendar className="w-4 h-4 text-teal-dark/60" />
              <select
                aria-label="Select first consultation visit"
                value={selectedC1}
                onChange={(e) => setSelectedC1(e.target.value)}
                className="bg-transparent text-xs font-bold text-teal-dark focus:outline-none"
              >
                {consultations.map(c => (
                  <option key={c.id} value={c.id}>
                    {new Date(c.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {c.doctor_name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-bold text-teal-dark/40">vs</span>

            <div className="flex items-center gap-1.5 bg-canvas-subtle p-2 rounded-2xl border border-teal-dark/10">
              <Calendar className="w-4 h-4 text-teal-dark/60" />
              <select
                aria-label="Select second consultation visit"
                value={selectedC2}
                onChange={(e) => setSelectedC2(e.target.value)}
                className="bg-transparent text-xs font-bold text-teal-dark focus:outline-none"
              >
                {consultations.map(c => (
                  <option key={c.id} value={c.id}>
                    {new Date(c.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {c.doctor_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-teal-dark font-medium">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-dark" />
          Analyzing clinical changes between visits...
        </div>
      ) : diffData ? (
        <>
          {/* Summary Banner Card */}
          <div className="bg-teal-dark text-white rounded-card p-6 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-mint/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-mint/20 text-mint px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-mint" />
                  <span>Clinical Trajectory Summary</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {diffData.overall_takeaway}
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <Clock className="w-3.5 h-3.5 text-mint" />
                  <span>Time span: {diffData.days_between} days between clinical encounters</span>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="flex items-center gap-4">
                <div className="bg-white/10 rounded-2xl p-4 text-center min-w-[100px] border border-white/15">
                  <div className="text-2xl font-black text-mint flex items-center justify-center gap-1">
                    <ArrowDownRight className="w-5 h-5 text-mint" />
                    {diffData.improved_count}
                  </div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">
                    Improved
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 text-center min-w-[100px] border border-white/15">
                  <div className="text-2xl font-black text-coral flex items-center justify-center gap-1">
                    {diffData.attention_count > 0 ? (
                      <AlertCircle className="w-5 h-5 text-coral" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-mint" />
                    )}
                    {diffData.attention_count}
                  </div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">
                    Needs Check
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Encounter Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earlier Consultation */}
            <div className="bg-white rounded-card p-5 border border-teal-dark/10 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-dark/60 bg-canvas-subtle px-3 py-1 rounded-full">
                  Previous Visit
                </span>
                <span className="text-xs font-semibold text-teal-dark/70">
                  {new Date(diffData.consultation_earlier.visit_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-teal-dark flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-dark" />
                {diffData.consultation_earlier.doctor_name}
              </h3>
              <p className="text-xs text-teal-dark/70 mb-2">
                {diffData.consultation_earlier.clinic_name} • {diffData.consultation_earlier.specialty}
              </p>
              <div className="bg-canvas-subtle rounded-2xl p-3 text-xs text-teal-dark/80 mt-2">
                <strong>Chief Complaint:</strong> {diffData.consultation_earlier.chief_complaint}
              </div>
            </div>

            {/* Recent Consultation */}
            <div className="bg-mint/30 rounded-card p-5 border border-mint/60 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-dark bg-mint px-3 py-1 rounded-full">
                  Recent Visit
                </span>
                <span className="text-xs font-semibold text-teal-dark">
                  {new Date(diffData.consultation_recent.visit_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-teal-dark flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-dark" />
                {diffData.consultation_recent.doctor_name}
              </h3>
              <p className="text-xs text-teal-dark/70 mb-2">
                {diffData.consultation_recent.clinic_name} • {diffData.consultation_recent.specialty}
              </p>
              <div className="bg-white/80 rounded-2xl p-3 text-xs text-teal-dark/80 mt-2">
                <strong>Progress Review:</strong> {diffData.consultation_recent.chief_complaint}
              </div>
            </div>
          </div>

          {/* SECTION 1: Vital Metrics Shift Table */}
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-teal-dark" />
              <h3 className="text-lg font-bold text-teal-dark">Clinical Vitals Shift</h3>
              <span className="text-xs bg-canvas-subtle text-teal-dark/70 px-2 py-0.5 rounded-full font-semibold">
                Objective Measurements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-teal-dark/10 text-teal-dark/60 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Vital Metric</th>
                    <th className="pb-3 font-semibold">Previous Visit</th>
                    <th className="pb-3 font-semibold">Recent Visit</th>
                    <th className="pb-3 font-semibold">Change & Clinical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-dark/5">
                  {diffData.diff_summary.filter(d => d.category === 'vitals').map((item, idx) => {
                    const isImproved = item.semantic_status === 'improved';
                    const isAttention = item.semantic_status === 'needs_attention';

                    return (
                      <tr key={idx} className="hover:bg-canvas-subtle/50 transition-colors">
                        <td className="py-3.5 font-bold text-teal-dark">
                          {item.item_name}
                        </td>
                        <td className="py-3.5 text-teal-dark/70 font-medium">
                          {item.old_value}
                        </td>
                        <td className="py-3.5 font-bold text-teal-dark">
                          {item.new_value}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            {isImproved ? (
                              <span className="inline-flex items-center gap-1 bg-mint text-teal-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-pill">
                                <ArrowDownRight className="w-3.5 h-3.5 text-teal-dark stroke-[2.5]" />
                                Improved ({item.note})
                              </span>
                            ) : isAttention ? (
                              <span className="inline-flex items-center gap-1 bg-coral/20 text-coral-dark text-xs font-bold px-2.5 py-1 rounded-full border border-coral/30">
                                <AlertCircle className="w-3.5 h-3.5 text-coral-dark" />
                                Attention May Be Needed ({item.note})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-canvas-subtle text-teal-dark/70 text-xs font-medium px-2.5 py-1 rounded-full">
                                <Minus className="w-3.5 h-3.5" /> Stable ({item.note})
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: Medication Therapy Changes */}
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-teal-dark" />
              <h3 className="text-lg font-bold text-teal-dark">Medication Therapy Adjustments</h3>
              <span className="text-xs bg-canvas-subtle text-teal-dark/70 px-2 py-0.5 rounded-full font-semibold">
                Prescription Evolution
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diffData.diff_summary.filter(d => d.category === 'medications').map((med, idx) => {
                const isNew = med.semantic_status === 'new';
                const isAdjusted = med.semantic_status === 'changed';
                const isDiscontinued = med.semantic_status === 'discontinued';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isNew 
                        ? 'bg-mint-light/60 border-mint' 
                        : isAdjusted 
                        ? 'bg-pink-soft/30 border-pink' 
                        : isDiscontinued 
                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                        : 'bg-canvas-subtle border-teal-dark/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-teal-dark text-sm">
                        {med.item_name}
                      </span>
                      {isNew && (
                        <span className="text-[11px] font-bold bg-mint text-teal-dark px-2.5 py-0.5 rounded-full shadow-pill">
                          + New Medication
                        </span>
                      )}
                      {isAdjusted && (
                        <span className="text-[11px] font-bold bg-pink-accent/40 text-teal-dark px-2.5 py-0.5 rounded-full">
                          Dose Adjusted
                        </span>
                      )}
                      {isDiscontinued && (
                        <span className="text-[11px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          Discontinued
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1 text-teal-dark/80">
                      <div>
                        <span className="text-teal-dark/50 font-medium">Was: </span>
                        <span className="line-through decoration-coral">{med.old_value}</span>
                      </div>
                      <div>
                        <span className="text-teal-dark/50 font-medium">Now: </span>
                        <span className="font-bold text-teal-dark">{med.new_value}</span>
                      </div>
                      {med.note && (
                        <p className="text-[11px] text-teal-dark/70 italic pt-1 border-t border-teal-dark/5">
                          Doctor's reason: {med.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Clinical Assessment & Lifestyle Diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-card p-5 border border-teal-dark/10 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-teal-dark" />
                <h4 className="font-bold text-teal-dark text-sm">Clinical Plan Evolution</h4>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-teal-dark/60 block mb-1">Previous Plan:</span>
                  <p className="bg-canvas-subtle p-3 rounded-2xl text-teal-dark/80">
                    {diffData.consultation_earlier.plan_notes}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-teal-dark block mb-1">Updated Plan:</span>
                  <p className="bg-mint/30 p-3 rounded-2xl text-teal-dark font-medium border border-mint">
                    {diffData.consultation_recent.plan_notes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-card p-5 border border-teal-dark/10 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-teal-dark" />
                <h4 className="font-bold text-teal-dark text-sm">Lifestyle & Guidance Evolution</h4>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-teal-dark/60 block mb-1">Previous Advice:</span>
                  <p className="bg-canvas-subtle p-3 rounded-2xl text-teal-dark/80">
                    {diffData.consultation_earlier.lifestyle_advice || "Standard maintenance"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-teal-dark block mb-1">Current Guidance:</span>
                  <p className="bg-mint/30 p-3 rounded-2xl text-teal-dark font-medium border border-mint">
                    {diffData.consultation_recent.lifestyle_advice}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
};
