import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  Plus, 
  Activity, 
  ArrowDownRight, 
  AlertCircle,
  Target,
  CheckCircle2
} from 'lucide-react';
import { LogReadingModal } from '../components/LogReadingModal';

export const ContinuousMonitoring = () => {
  const { authFetch } = useAuth();
  const [trends, setTrends] = useState([]);
  const [activeMetric, setActiveMetric] = useState('blood_pressure');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/vitals/trends');
      if (res.ok) {
        const data = await res.json();
        setTrends(data);
      }
    } catch (e) {
      console.error('Error fetching vitals trends:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const currentTrend = trends.find(t => t.metric_type === activeMetric) || trends[0];

  return (
    <div className="space-y-6">
      
      {/* Header with Quick Log CTA */}
      <div className="bg-canvas-card rounded-card p-6 border border-teal-dark/10 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-mint text-teal-dark flex items-center justify-center shadow-pill">
            <TrendingUp className="w-6 h-6 text-teal-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-teal-dark">Continuous Monitoring</h1>
            <p className="text-sm text-teal-dark/70">
              14-day chronological trends plotted against your care plan target lines.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-dark hover:bg-teal-light text-white text-sm font-bold shadow-pill transition-all"
        >
          <Plus className="w-4 h-4 text-mint stroke-[3]" />
          <span>Log New Reading</span>
        </button>
      </div>

      {/* Sparkline Rows: 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((m) => {
          const isSelected = m.metric_type === activeMetric;
          const isSystolic = m.metric_type === 'blood_pressure';

          return (
            <button
              key={m.metric_type}
              onClick={() => setActiveMetric(m.metric_type)}
              className={`p-4 rounded-card text-left transition-all border ${
                isSelected
                  ? 'bg-teal-dark text-white border-teal-dark shadow-float ring-2 ring-mint'
                  : 'bg-white text-teal-dark border-teal-dark/10 hover:border-teal-dark/30 shadow-soft'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-mint' : 'text-teal-dark/60'}`}>
                  {m.label}
                </span>
                {m.status === 'improved' || m.status === 'normal' ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    isSelected ? 'bg-mint text-teal-dark' : 'bg-mint/80 text-teal-dark'
                  }`}>
                    <ArrowDownRight className="w-3 h-3" /> In Range
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    isSelected ? 'bg-coral text-white' : 'bg-coral/20 text-coral-dark'
                  }`}>
                    <AlertCircle className="w-3 h-3" /> Check
                  </span>
                )}
              </div>

              {/* Big Value Display */}
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-black">
                  {m.latest_value}
                  {isSystolic && m.latest_secondary_value ? ` / ${m.latest_secondary_value}` : ''}
                </span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-white/70' : 'text-teal-dark/60'}`}>
                  {m.unit}
                </span>
              </div>

              {/* Target Text */}
              <p className={`text-[11px] truncate mb-3 ${isSelected ? 'text-white/80' : 'text-teal-dark/70'}`}>
                {m.clinician_target_text}
              </p>

              {/* Mini Sparkline Chart */}
              <div className="h-10 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.history}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={isSelected ? "#CBF5EF" : "#0F4953"}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Recharts Card with Dashed Target Line */}
      {currentTrend && (
        <div className="bg-white rounded-card p-6 border border-teal-dark/10 shadow-soft">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-teal-dark/10 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-teal-dark">
                  {currentTrend.label} 14-Day Timeline
                </h2>
                <span className="text-xs font-semibold bg-mint text-teal-dark px-2.5 py-0.5 rounded-full">
                  Target: {currentTrend.average_target} {currentTrend.unit}
                </span>
              </div>
              <p className="text-xs text-teal-dark/60 mt-0.5">
                Bars represent daily readings; the dashed line indicates your target boundary.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-canvas-subtle px-3 py-1.5 rounded-full border border-teal-dark/10 text-xs text-teal-dark font-medium">
              <Target className="w-4 h-4 text-teal-dark" />
              <span>{currentTrend.clinician_target_text}</span>
            </div>
          </div>

          {/* Recharts Bar Chart with Dashed Average Reference Line */}
          <div className="h-72 w-full pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentTrend.history} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6FAF6" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#0F4953', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#CBF5EF' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#0F4953', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(203, 245, 239, 0.4)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-teal-dark text-white p-3 rounded-2xl shadow-float text-xs border border-mint/30">
                          <p className="font-bold text-mint mb-1">{data.date}</p>
                          <p className="text-sm font-black">
                            {data.value} {currentTrend.unit}
                            {data.secondary_value ? ` / ${data.secondary_value} mmHg` : ''}
                          </p>
                          <p className="text-[10px] text-white/70 mt-1">
                            {currentTrend.clinician_target_text}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Dashed Target Line */}
                <ReferenceLine
                  y={currentTrend.average_target}
                  stroke="#0F4953"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Target: ${currentTrend.average_target} ${currentTrend.unit}`,
                    fill: '#0F4953',
                    fontSize: 11,
                    fontWeight: 700,
                    position: 'top',
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#CBF5EF"
                  radius={[8, 8, 0, 0]}
                  name={currentTrend.label}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-canvas-subtle border border-teal-dark/5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-dark flex-shrink-0 mt-0.5" />
            <div className="text-xs text-teal-dark">
              <strong>Progress Review: </strong>
              Over the last 14 days, your readings demonstrate healthy stability. 
              {currentTrend.is_improved ? ' Your positive trend reflects strong medication adherence and regular walks.' : ' Continue regular monitoring.'}
            </div>
          </div>
        </div>
      )}

      {/* Log Reading Modal */}
      <LogReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReadingLogged={() => fetchTrends()}
      />

    </div>
  );
};
