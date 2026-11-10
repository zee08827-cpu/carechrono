import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { MedicalDisclaimerFooter } from './components/MedicalDisclaimerFooter';
import { Dashboard } from './pages/Dashboard';
import { ConsultationCompare } from './pages/ConsultationCompare';
import { ContinuousMonitoring } from './pages/ContinuousMonitoring';
import { MedicationsPage } from './pages/MedicationsPage';
import { HealthRecordsPage } from './pages/HealthRecordsPage';
import { MyTargetsAndAlertsPage } from './pages/MyTargetsAndAlertsPage';
import { CaregiverConsentPage } from './pages/CaregiverConsentPage';
import { SeniorModeView } from './pages/SeniorModeView';
import { SharedDoctorSummary } from './pages/SharedDoctorSummary';

export function App() {
  const { user, isSeniorMode, loading, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(1);

  // Check if URL has doctor share token
  const searchParams = new URLSearchParams(window.location.search);
  const shareToken = searchParams.get('token');
  const isSharedView = window.location.pathname.includes('shared-doctor-summary') || Boolean(shareToken);

  // Poll or fetch active alerts count
  useEffect(() => {
    if (user && !isSharedView) {
      const fetchAlertsCount = async () => {
        try {
          const res = await authFetch('/api/alerts');
          if (res.ok) {
            const data = await res.json();
            const unacked = data.filter((a) => !a.is_acknowledged).length;
            setAlertCount(unacked);
          }
        } catch {
          // Keep previous count on error
        }
      };
      fetchAlertsCount();
    }
  }, [user, activeTab, isSharedView]);

  // If viewing via 24h Doctor Share Link, render standalone read-only doctor brief
  if (isSharedView && shareToken) {
    return <SharedDoctorSummary token={shareToken} />;
  }

  if (isSeniorMode) {
    return <SeniorModeView />;
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-teal-dark">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-dark border-t-mint rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm">Loading CareChrono Health Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      <div>
        <Navbar
          onOpenAlerts={() => setActiveTab('targets')}
          alertCount={alertCount}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          {activeTab === 'dashboard' && <Dashboard onSelectTab={setActiveTab} />}
          {activeTab === 'compare' && <ConsultationCompare />}
          {activeTab === 'trends' && <ContinuousMonitoring />}
          {activeTab === 'meds' && <MedicationsPage />}
          {activeTab === 'records' && <HealthRecordsPage />}
          {activeTab === 'targets' && <MyTargetsAndAlertsPage />}
          {activeTab === 'consent' && <CaregiverConsentPage />}
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <MedicalDisclaimerFooter />
    </div>
  );
}

export default App;
