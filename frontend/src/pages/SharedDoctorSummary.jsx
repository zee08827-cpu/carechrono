import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Clock, 
  Calendar, 
  Activity, 
  Pill, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';

export const SharedDoctorSummary = ({ token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const res = await fetch(`/api/consultations/shared/${token}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const errJson = await res.json().catch(() => ({}));
          setError(errJson.detail || 'This doctor share link has expired or is invalid.');
        }
      } catch (err) {
        setError('Failed to connect to CareChrono medical server.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedData();
    } else {
      setError('No doctor access token provided in link.');
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-teal-dark p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-dark border-t-mint rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm">Verifying 24-Hour Clinical Share Link...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-white rounded-card max-w-md w-full p-8 shadow-float border border-coral/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-coral/20 text-coral-dark flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-coral-dark" />
          </div>
          <h2 className="text-xl font-bold text-teal-dark">Access Link Expired or Invalid</h2>
          <p className="text-xs text-teal-dark/75 leading-relaxed">
            {error || 'This temporary clinical review link has expired or has been revoked by the patient.'}
          </p>
          <div className="p-3 bg-canvas-subtle rounded-2xl text-[11px] text-teal-dark/70 font-semibold border border-teal-dark/10">
            For patient privacy and governance, doctor review tokens automatically expire after 24 hours. Please ask the patient to generate a new share link.
          </div>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-teal-dark text-white text-xs font-bold shadow-pill hover:bg-teal-light transition-all"
          >
            Return to CareChrono Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-teal-dark">
      {/* Top Clinical Header Bar */}
      <header className="sticky top-0 z-40 bg-teal-dark text-white px-4 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-mint text-teal-dark flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5 text-teal-dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight">CareChrono</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-mint text-teal-dark px-2 py-0.5 rounded-full">
                  Physician Read-Only Summary
                </span>
              </div>
              <p className="text-xs text-white/70">
                Patient-Authorized 24-Hour Clinical Encounter Brief
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <Clock className="w-3.5 h-3.5 text-mint" />
              <span>Expires in <strong>{data.hours_remaining} hours</strong></span>
            </div>
            <a
              href="/"
              className="text-xs font-semibold text-mint hover:underline"
            >
              Patient Login →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Patient Identity Banner */}
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark/60">
              Patient Profile
            </span>
            <h1 className="text-2xl font-black text-teal-dark">{data.patient.full_name}</h1>
            <p className="text-xs text-teal-dark/75 mt-1">
              <strong>Active Conditions:</strong> {data.patient.conditions}
            </p>
          </div>

          <div className="bg-mint/40 p-4 rounded-2xl border border-mint text-xs text-teal-dark space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-dark" />
              <span>Authorized Patient Record Sharing</span>
            </div>
            <p className="text-[11px] text-teal-dark/80">
              Direct patient-generated access token. No third-party data broker.
            </p>
          </div>
        </div>

        {/* Section 1: Recent Consultations & Encounter Notes */}
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-teal-dark/10 pb-3">
            <Calendar className="w-5 h-5 text-teal-dark" />
            <h2 className="text-lg font-bold text-teal-dark">Encounter History & Clinical Notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.consultations.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-canvas-subtle border border-teal-dark/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-dark bg-white px-2.5 py-1 rounded-full border border-teal-dark/10">
                    {new Date(c.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-teal-dark/70 font-medium">{c.specialty}</span>
                </div>

                <div>
                  <h3 className="font-bold text-teal-dark text-base">{c.doctor_name}</h3>
                  <p className="text-xs text-teal-dark/60">{c.clinic_name}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-teal-dark/5">
                    <strong>Chief Complaint:</strong> {c.chief_complaint}
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-teal-dark/5">
                    <strong>Assessment:</strong> {c.clinical_assessment}
                  </div>
                  <div className="bg-mint/30 p-3 rounded-xl border border-mint text-teal-dark font-medium">
                    <strong>Plan & Guidance:</strong> {c.plan_notes}
                  </div>
                </div>

                {/* Vitals at this visit */}
                {c.vitals_recorded && c.vitals_recorded.length > 0 && (
                  <div className="pt-2 border-t border-teal-dark/10">
                    <span className="text-[11px] font-bold text-teal-dark/70 block mb-1">Encounter Vitals:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.vitals_recorded.map((v, idx) => (
                        <span key={idx} className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-teal-dark/10 font-semibold">
                          {v.metric_type.replace(/_/g, ' ')}: {v.value} {v.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Recent Home Monitoring Vitals */}
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-teal-dark/10 pb-3">
            <Activity className="w-5 h-5 text-teal-dark" />
            <h2 className="text-lg font-bold text-teal-dark">Recent Home Monitoring Readings (Last 14)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-teal-dark/10 text-teal-dark/60 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Date / Time</th>
                  <th className="pb-2 font-semibold">Metric</th>
                  <th className="pb-2 font-semibold">Measured Value</th>
                  <th className="pb-2 font-semibold">Context</th>
                  <th className="pb-2 font-semibold">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-dark/5">
                {data.recent_vitals.map((v) => (
                  <tr key={v.id} className="hover:bg-canvas-subtle/50">
                    <td className="py-2.5 font-medium text-teal-dark/70">
                      {new Date(v.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-bold capitalize text-teal-dark">
                      {v.metric_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 font-black text-teal-dark">
                      {v.value}{v.secondary_value ? ` / ${v.secondary_value}` : ''} {v.unit}
                    </td>
                    <td className="py-2.5 text-teal-dark/60 capitalize">
                      {v.context?.replace(/_/g, ' ') || 'standard'}
                    </td>
                    <td className="py-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-canvas-subtle text-teal-dark border border-teal-dark/10">
                        {v.logged_by}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Diagnostic Labs & Document Reports */}
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-teal-dark/10 pb-3">
            <FileText className="w-5 h-5 text-teal-dark" />
            <h2 className="text-lg font-bold text-teal-dark">Diagnostic Reports & Prescriptions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.records.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-canvas-subtle border border-teal-dark/10 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-teal-dark px-2.5 py-0.5 rounded-full border border-teal-dark/10">
                    {r.category}
                  </span>
                  <span className="text-xs text-teal-dark/60 font-medium">
                    {new Date(r.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h4 className="font-bold text-teal-dark text-sm">{r.title}</h4>
                <p className="text-xs text-teal-dark/80 line-clamp-2">{r.summary}</p>
                {r.key_findings && (
                  <div className="p-2.5 rounded-xl bg-mint-light/60 border border-mint text-[11px] text-teal-dark">
                    <strong>Findings: </strong>{r.key_findings}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-teal-dark/60 pt-2 border-t border-teal-dark/5">
                  <span>{r.provider_name || r.facility}</span>
                  <span className="font-semibold">{r.file_size_kb} KB PDF</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Disclaimer Footer */}
        <div className="bg-canvas-subtle rounded-2xl p-4 text-center text-xs text-teal-dark/80 border border-teal-dark/10 space-y-1">
          <div className="inline-flex items-center gap-1.5 font-bold text-coral-dark">
            <ShieldAlert className="w-4 h-4 text-coral-dark" />
            <span>Clinical Notice</span>
          </div>
          <p>{data.safety_disclaimer}</p>
        </div>

      </main>
    </div>
  );
};
