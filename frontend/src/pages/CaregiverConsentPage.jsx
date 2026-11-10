import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';

export const CaregiverConsentPage = () => {
  const { authFetch, user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  const isCaregiver = user?.role === 'caregiver';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isCaregiver) {
        const res = await authFetch('/api/caregivers/patients');
        if (res.ok) setPatients(await res.json());
      } else {
        const res = await authFetch('/api/caregivers/consents');
        if (res.ok) setConsents(await res.json());
      }
    } catch (e) {
      console.error('Error fetching caregiver data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!emailInput) return;

    try {
      const res = await authFetch('/api/caregivers/grant', {
        method: 'POST',
        body: JSON.stringify({
          caregiver_email: emailInput,
          notes: notesInput || 'Granted view access for vitals, medications, and smart alerts'
        })
      });
      if (res.ok) {
        setFeedback('Explicit consent granted to caregiver.');
        setEmailInput('');
        setNotesInput('');
        setTimeout(() => setFeedback(''), 3000);
        fetchData();
      }
    } catch (e) {
      console.error('Error granting consent:', e);
    }
  };

  const handleRevoke = async (consentId) => {
    if (!window.confirm('Are you sure you want to revoke caregiver access? They will lose access immediately.')) {
      return;
    }
    try {
      const res = await authFetch(`/api/caregivers/${consentId}/revoke`, { method: 'POST' });
      if (res.ok) {
        setFeedback('Caregiver consent revoked. Access immediately cut off.');
        setTimeout(() => setFeedback(''), 3000);
        fetchData();
      }
    } catch (e) {
      console.error('Error revoking consent:', e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
              <Users className="w-6 h-6 text-teal-dark" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-dark">Caregiver Consent & Delegation</h1>
              <p className="text-sm text-teal-dark/70">
                Rule: Caregiver access requires explicit patient consent, revocable anytime.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-mint/40 text-teal-dark px-3 py-1 rounded-full text-xs font-bold border border-mint">
            <ShieldCheck className="w-4 h-4 text-teal-dark" />
            <span>Strict Patient Data Sovereign</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-mint text-teal-dark rounded-2xl text-xs font-bold flex items-center gap-2 shadow-soft">
          <CheckCircle2 className="w-4 h-4 text-teal-dark" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CAREGIVER PERSPECTIVE: View of consented patients */}
      {isCaregiver ? (
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
          <h2 className="text-lg font-bold text-teal-dark">Patients Who Granted You Consent</h2>
          <p className="text-xs text-teal-dark/60">
            As a designated caregiver, you have explicit consent to monitor these patients' health trends and emergency alerts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {patients.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-canvas-subtle border border-teal-dark/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
                      alt={p.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-mint"
                    />
                    <div>
                      <h4 className="font-bold text-teal-dark text-base">{p.full_name}</h4>
                      <p className="text-xs text-teal-dark/70">{p.conditions}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-mint text-teal-dark px-3 py-1 rounded-full shadow-pill">
                    Active Consent
                  </span>
                </div>

                <div className="text-xs text-teal-dark/80 bg-white p-3 rounded-xl border border-teal-dark/5 space-y-1">
                  <div><strong>Phone:</strong> {p.phone || '+1 (555) 789-2345'}</div>
                  <div><strong>Access Level:</strong> Full Vitals, Medications, and Smart Alerts</div>
                </div>

                <div className="text-[11px] text-teal-dark/60 italic">
                  * Patient retains the unilateral right to revoke consent at any moment.
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PATIENT PERSPECTIVE: Manage caregiver access */
        <div className="space-y-6">
          {/* Active Consents Card */}
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
              <h2 className="text-lg font-bold text-teal-dark">Your Authorized Caregivers</h2>
              <span className="text-xs font-semibold text-teal-dark/70 bg-canvas-subtle px-3 py-1 rounded-full">
                {consents.filter(c => c.status === 'active').length} Active
              </span>
            </div>

            <div className="space-y-3">
              {consents.length === 0 ? (
                <p className="text-xs text-teal-dark/60 py-4 text-center">
                  No caregivers currently authorized. You can invite a family member or nurse below.
                </p>
              ) : (
                consents.map((c) => {
                  const isActive = c.status === 'active';
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActive ? 'bg-mint/20 border-mint' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-teal-dark text-base">{c.caregiver_name}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isActive ? 'bg-mint text-teal-dark shadow-pill' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-teal-dark/70 font-medium">
                          {c.caregiver_email} • Granted {new Date(c.granted_at).toLocaleDateString()}
                        </p>
                        {c.notes && (
                          <p className="text-[11px] text-teal-dark/80 italic">"{c.notes}"</p>
                        )}
                      </div>

                      {/* 1-Click Immediate Revoke Button */}
                      <div>
                        {isActive ? (
                          <button
                            onClick={() => handleRevoke(c.id)}
                            className="px-4 py-2 bg-coral/20 hover:bg-coral text-coral-dark hover:text-white text-xs font-bold rounded-full transition-all border border-coral/30"
                          >
                            Revoke Consent
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 font-semibold">
                            Revoked on {c.revoked_at ? new Date(c.revoked_at).toLocaleDateString() : 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grant New Consent Form */}
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-dark" />
              <h3 className="text-base font-bold text-teal-dark">Grant New Caregiver Access</h3>
            </div>
            <p className="text-xs text-teal-dark/70">
              Enter your family caregiver's email to authorize dashboard and alert access. You can revoke this anytime.
            </p>

            <form onSubmit={handleGrant} className="space-y-3 max-w-lg">
              <div>
                <label htmlFor="caregiver-email-input" className="block text-xs font-bold text-teal-dark mb-1">
                  Caregiver Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-teal-dark/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="caregiver-email-input"
                    type="email"
                    placeholder="caregiver@carechrono.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-teal-dark/20 text-xs text-teal-dark font-medium focus:outline-none focus:ring-2 focus:ring-mint"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes-delegation-input" className="block text-xs font-bold text-teal-dark mb-1">
                  Care Relationship & Notes
                </label>
                <input
                  id="notes-delegation-input"
                  type="text"
                  placeholder="e.g. My daughter Kelly — designated primary emergency contact"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-teal-dark/20 text-xs text-teal-dark font-medium focus:outline-none focus:ring-2 focus:ring-mint"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-dark hover:bg-teal-light text-white text-xs font-bold rounded-full shadow-pill transition-all"
              >
                Grant Explicit Consent
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
