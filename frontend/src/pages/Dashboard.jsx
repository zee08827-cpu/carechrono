import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HealthBloom } from '../components/HealthBloom';
import { LogReadingModal } from '../components/LogReadingModal';
import { 
  Pill, 
  Activity, 
  GitCompare, 
  AlertCircle, 
  CheckCircle2, 
  ArrowDownRight, 
  Calendar, 
  Plus, 
  ChevronRight,
  FolderHeart,
  Target
} from 'lucide-react';

export const Dashboard = ({ onSelectTab }) => {
  const { authFetch, user } = useAuth();
  const [bloomStatus, setBloomStatus] = useState(null);
  const [trends, setTrends] = useState([]);
  const [meds, setMeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [bloomRes, trendsRes, medsRes, alertsRes] = await Promise.all([
        authFetch('/api/medications/bloom-status'),
        authFetch('/api/vitals/trends'),
        authFetch('/api/medications'),
        authFetch('/api/alerts')
      ]);

      if (bloomRes.ok) setBloomStatus(await bloomRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
      if (medsRes.ok) setMeds(await medsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const activeAlerts = alerts.filter(a => !a.is_acknowledged);
  const bpTrend = trends.find(t => t.metric_type === 'blood_pressure');
  const glucoseTrend = trends.find(t => t.metric_type === 'blood_glucose');

  return (
    <div className="space-y-6">
      
      {/* Active Smart Alert Banner */}
      {activeAlerts.length > 0 && (
        <div 
          onClick={() => onSelectTab('targets')}
          className="cursor-pointer bg-coral/15 border border-coral/40 rounded-card p-4 flex items-center justify-between gap-3 shadow-soft hover:bg-coral/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-coral text-teal-dark flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-teal-dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-coral text-teal-dark px-2.5 py-0.5 rounded-full">
                  Attention May Be Needed
                </span>
                <span className="text-xs font-bold text-teal-dark">
                  {activeAlerts[0].title}
                </span>
              </div>
              <p className="text-xs text-teal-dark/80 mt-0.5 line-clamp-1">
                {activeAlerts[0].message}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-dark flex items-center gap-1 flex-shrink-0">
            Review <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* ONE DARK HERO CARD */}
      <div className="bg-teal-dark text-white rounded-card p-6 sm:p-8 shadow-float relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-mint/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
          
          {/* Patient Profile */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
                alt={user?.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-mint shadow-pill"
              />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-mint flex items-center gap-1">
                  Chronic Care Health Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user?.full_name}
                </h1>
                <p className="text-xs text-white/70 mt-0.5">
                  ID: #4432124 • {user?.conditions}
                </p>
              </div>
            </div>

            {/* Quick Consultation Badge */}
            <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-mint" />
                <span>Last Encounter with Dr. Richard Chen</span>
              </div>
              <button
                onClick={() => onSelectTab('compare')}
                className="text-mint font-bold hover:underline flex items-center gap-0.5"
              >
                See What Changed →
              </button>
            </div>
          </div>

          {/* HEALTH BLOOM FLOWER */}
          <div className="flex-1 max-w-lg">
            <HealthBloom bloomStatus={bloomStatus} />
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="p-4 rounded-2xl bg-white hover:bg-canvas-subtle border border-teal-dark/10 shadow-soft text-left flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-mint text-teal-dark flex items-center justify-center font-bold">
            <Plus className="w-5 h-5 text-teal-dark stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-dark block">Log Reading</span>
            <span className="text-[11px] text-teal-dark/60">BP, Sugar, Pulse</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('compare')}
          className="p-4 rounded-2xl bg-white hover:bg-canvas-subtle border border-teal-dark/10 shadow-soft text-left flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-mint-light text-teal-dark flex items-center justify-center font-bold">
            <GitCompare className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-dark block">Visit Diff</span>
            <span className="text-[11px] text-teal-dark/60">What changed</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('targets')}
          className="p-4 rounded-2xl bg-white hover:bg-canvas-subtle border border-teal-dark/10 shadow-soft text-left flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-mint/50 text-teal-dark flex items-center justify-center font-bold">
            <Target className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-dark block">My Targets</span>
            <span className="text-[11px] text-teal-dark/60">Doctor & guidelines</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('records')}
          className="p-4 rounded-2xl bg-white hover:bg-canvas-subtle border border-teal-dark/10 shadow-soft text-left flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-canvas-subtle text-teal-dark flex items-center justify-center font-bold">
            <FolderHeart className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-dark block">Folders</span>
            <span className="text-[11px] text-teal-dark/60">Share with doctor</span>
          </div>
        </button>
      </div>

      {/* TWO COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Vitals Snapshot */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-dark" />
                <h2 className="text-lg font-bold text-teal-dark">Continuous Monitoring Highlights</h2>
              </div>
              <button
                onClick={() => onSelectTab('trends')}
                className="text-xs font-bold text-teal-dark hover:underline flex items-center gap-0.5"
              >
                14-Day View <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Blood Pressure Snapshot */}
            {bpTrend && (
              <div className="p-4 rounded-2xl bg-canvas-subtle border border-teal-dark/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-dark/60">
                    Blood Pressure
                  </span>
                  <div className="text-2xl font-black text-teal-dark mt-0.5">
                    {bpTrend.latest_value} / {bpTrend.latest_secondary_value || 80} <span className="text-xs font-bold text-teal-dark/60">mmHg</span>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-dark/70">
                    {bpTrend.clinician_target_text}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-mint text-teal-dark px-3 py-1 rounded-full shadow-pill">
                    <ArrowDownRight className="w-3.5 h-3.5 text-teal-dark stroke-[2.5]" />
                    In Target
                  </span>
                </div>
              </div>
            )}

            {/* Blood Glucose Snapshot */}
            {glucoseTrend && (
              <div className="p-4 rounded-2xl bg-canvas-subtle border border-teal-dark/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-dark/60">
                    Fasting Blood Glucose
                  </span>
                  <div className="text-2xl font-black text-teal-dark mt-0.5">
                    {glucoseTrend.latest_value} <span className="text-xs font-bold text-teal-dark/60">mg/dL</span>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-dark/70">
                    {glucoseTrend.clinician_target_text}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-mint text-teal-dark px-3 py-1 rounded-full shadow-pill">
                    <ArrowDownRight className="w-3.5 h-3.5 text-teal-dark stroke-[2.5]" />
                    Target Met
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Medication Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-teal-dark/10 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-dark" />
                <h2 className="text-lg font-bold text-teal-dark">Today's Regimen</h2>
              </div>
              <button
                onClick={() => onSelectTab('meds')}
                className="text-xs font-bold text-teal-dark hover:underline flex items-center gap-0.5"
              >
                All Meds <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {meds.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    m.taken_today
                      ? 'bg-mint-light/40 border-mint'
                      : 'bg-canvas-subtle border-teal-dark/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-teal-dark text-sm">{m.medication_name}</span>
                      <span className="text-[11px] text-teal-dark/60 font-semibold">({m.dosage})</span>
                    </div>
                    <p className="text-[11px] text-teal-dark/70 line-clamp-1 mt-0.5">
                      {m.instructions}
                    </p>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    m.taken_today ? 'bg-mint text-teal-dark shadow-pill' : 'bg-white text-teal-dark/70 border border-teal-dark/10'
                  }`}>
                    {m.taken_today ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {m.taken_today ? 'Taken' : 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSelectTab('meds')}
              className="w-full py-2.5 bg-canvas-subtle hover:bg-mint/40 text-teal-dark text-xs font-bold rounded-full transition-all border border-teal-dark/10 text-center"
            >
              Open Full Daily Schedule
            </button>
          </div>
        </div>

      </div>

      {/* Log Reading Modal */}
      <LogReadingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onReadingLogged={() => fetchDashboardData()}
      />

    </div>
  );
};
