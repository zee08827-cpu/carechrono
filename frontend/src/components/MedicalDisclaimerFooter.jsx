import React from 'react';
import { ShieldAlert, HeartPulse } from 'lucide-react';

export const MedicalDisclaimerFooter = () => {
  return (
    <footer className="mt-16 pb-24 pt-8 border-t border-teal-dark/10 bg-canvas-subtle/60 text-teal-dark">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-pink-soft/50 text-teal-dark px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <ShieldAlert className="w-4 h-4 text-coral-dark" />
          <span>Patient Safety & Medical Governance Notice</span>
        </div>
        
        <p className="text-xs text-teal-dark/80 max-w-2xl mx-auto leading-relaxed">
          <strong>CareChrono is not a diagnostic device or a substitute for professional clinical medical advice.</strong>{' '}
          All smart alerts, Health Bloom metrics, and consultation comparisons are designed exclusively as assistive tracking aids 
          guided by targets set by you and your doctor alongside general health guidelines. In an acute medical emergency, call 911 or your local emergency services immediately.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-teal-dark/60 font-medium">
          <span className="flex items-center gap-1">
            <HeartPulse className="w-3.5 h-3.5 text-teal" /> Patient Centred
          </span>
          <span>•</span>
          <span>WCAG 2.1 AA Accessible</span>
          <span>•</span>
          <span>Patient-Consent Controlled Sharing</span>
          <span>•</span>
          <span>© 2026 CareChrono Health</span>
        </div>
      </div>
    </footer>
  );
};
