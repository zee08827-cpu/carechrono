import React, { useState } from 'react';
import { X, Activity, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LogReadingModal = ({ isOpen, onClose, onReadingLogged }) => {
  const { authFetch } = useAuth();
  const [metricType, setMetricType] = useState('blood_pressure');
  const [value, setValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');
  const [context, setContext] = useState('morning_resting');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value) return;

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      metric_type: metricType,
      value: parseFloat(value),
      secondary_value: secondaryValue ? parseFloat(secondaryValue) : null,
      unit: metricType === 'blood_pressure' ? 'mmHg' : (metricType === 'blood_glucose' ? 'mg/dL' : (metricType === 'heart_rate' ? 'bpm' : 'kg')),
      context: context,
      notes: notes || 'Manual entry via CareChrono'
    };

    try {
      const res = await authFetch('/api/vitals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback({ type: 'success', text: 'Reading successfully recorded!' });
        if (onReadingLogged) onReadingLogged(data);
        setTimeout(() => {
          onClose();
          setValue('');
          setSecondaryValue('');
          setNotes('');
          setFeedback(null);
        }, 1000);
      } else {
        setFeedback({ type: 'error', text: 'Failed to record reading. Please check values.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network connection issue.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-card w-full max-w-md p-6 shadow-float border border-teal-dark/10 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-dark/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-mint text-teal-dark flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-teal-dark" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-teal-dark">Log Health Reading</h3>
              <p className="text-xs text-teal-dark/60">Monitored against care plan targets and safety floors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-canvas-subtle text-teal-dark/60 hover:text-teal-dark transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Selector Pills */}
        <div className="my-4">
          <label className="block text-xs font-semibold text-teal-dark mb-1.5">
            Select Metric to Log
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
              { id: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL' },
              { id: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
              { id: 'weight', label: 'Body Weight', unit: 'kg' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetricType(m.id)}
                className={`py-2 px-3 rounded-full text-xs font-bold text-center border transition-all ${
                  metricType === m.id
                    ? 'bg-teal-dark text-white border-teal-dark shadow-pill'
                    : 'bg-canvas-subtle text-teal-dark/80 border-teal-dark/10 hover:border-teal-dark/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form with WCAG AA labeled inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {metricType === 'blood_pressure' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="systolic-input" className="block text-xs font-bold text-teal-dark mb-1">
                  Systolic (Upper) <span className="text-teal-dark/50">mmHg</span>
                </label>
                <input
                  id="systolic-input"
                  type="number"
                  placeholder="e.g. 125"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  min="60"
                  max="260"
                  className="w-full px-4 py-2.5 rounded-2xl border border-teal-dark/20 text-teal-dark font-bold text-lg focus:outline-none focus:ring-2 focus:ring-mint focus:border-teal-dark"
                />
              </div>
              <div>
                <label htmlFor="diastolic-input" className="block text-xs font-bold text-teal-dark mb-1">
                  Diastolic (Lower) <span className="text-teal-dark/50">mmHg</span>
                </label>
                <input
                  id="diastolic-input"
                  type="number"
                  placeholder="e.g. 80"
                  value={secondaryValue}
                  onChange={(e) => setSecondaryValue(e.target.value)}
                  required
                  min="40"
                  max="160"
                  className="w-full px-4 py-2.5 rounded-2xl border border-teal-dark/20 text-teal-dark font-bold text-lg focus:outline-none focus:ring-2 focus:ring-mint focus:border-teal-dark"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="single-val-input" className="block text-xs font-bold text-teal-dark mb-1">
                {metricType === 'blood_glucose' ? 'Fasting Glucose (mg/dL)' : (metricType === 'heart_rate' ? 'Heart Rate (bpm)' : 'Weight (kg)')}
              </label>
              <input
                id="single-val-input"
                type="number"
                step="0.1"
                placeholder={metricType === 'blood_glucose' ? 'e.g. 115' : (metricType === 'heart_rate' ? 'e.g. 72' : 'e.g. 79.5')}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-teal-dark/20 text-teal-dark font-bold text-lg focus:outline-none focus:ring-2 focus:ring-mint focus:border-teal-dark"
              />
            </div>
          )}

          <div>
            <label htmlFor="context-select" className="block text-xs font-bold text-teal-dark mb-1">
              Measurement Context
            </label>
            <select
              id="context-select"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-teal-dark/20 text-teal-dark text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mint"
            >
              <option value="morning_resting">Morning (Resting)</option>
              <option value="fasting">Fasting</option>
              <option value="post_meal">Post-Meal (2 Hours)</option>
              <option value="bedtime">Before Bedtime</option>
              <option value="post_exercise">Post-Exercise</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes-input" className="block text-xs font-bold text-teal-dark mb-1">
              Clinical Note or Symptoms (Optional)
            </label>
            <input
              id="notes-input"
              type="text"
              placeholder="e.g. Felt fine, sat for 5 minutes prior"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-teal-dark/20 text-teal-dark text-sm focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-mint text-teal-dark' : 'bg-pink-soft text-coral-dark'
            }`}>
              {feedback.type === 'success' ? <Check className="w-4 h-4 text-teal-dark" /> : <AlertCircle className="w-4 h-4 text-coral-dark" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-dark hover:bg-teal-light text-white font-bold rounded-full shadow-pill transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Reading...' : 'Save & Check Thresholds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
