import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Activity, 
  UserCheck, 
  Users, 
  Bell, 
  Sun
} from 'lucide-react';

export const Navbar = ({ onOpenAlerts, alertCount = 0 }) => {
  const { user, switchDemoRole, isSeniorMode, toggleSeniorMode } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-teal-dark/5 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-dark text-mint flex items-center justify-center shadow-pill">
            <Activity className="w-5 h-5 text-mint" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-teal-dark">
                CARE<span className="text-coral">CHRONO</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-mint text-teal-dark px-2 py-0.5 rounded-full">
                Patient Owned
              </span>
            </div>
            <p className="text-xs text-teal-dark/60 hidden sm:block">
              Patient-Centred Chronic Disease Management
            </p>
          </div>
        </div>

        {/* Center: Roles strictly limited to Patient | Caregiver */}
        <div className="flex items-center bg-canvas-subtle p-1 rounded-full border border-teal-dark/10 shadow-inner">
          <button
            onClick={() => switchDemoRole('patient')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              user?.role === 'patient'
                ? 'bg-teal-dark text-white shadow-pill'
                : 'text-teal-dark/70 hover:text-teal-dark'
            }`}
            title="Arthur Pendelton (Patient)"
          >
            <UserCheck className="w-3.5 h-3.5" /> Patient
          </button>

          <button
            onClick={() => switchDemoRole('caregiver')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              user?.role === 'caregiver'
                ? 'bg-teal-dark text-white shadow-pill'
                : 'text-teal-dark/70 hover:text-teal-dark'
            }`}
            title="Kelly Johnson (Family Caregiver)"
          >
            <Users className="w-3.5 h-3.5" /> Caregiver
          </button>
        </div>

        {/* Right Action Controls: Senior Mode Toggle + Alert Bell + User Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Senior Mode Toggle Pill */}
          <button
            onClick={toggleSeniorMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isSeniorMode
                ? 'bg-teal-dark text-mint border-teal-dark shadow-pill ring-2 ring-mint'
                : 'bg-white text-teal-dark border-teal-dark/20 hover:border-teal-dark/50'
            }`}
            title="Toggle Senior Mode (High Contrast & Large Buttons)"
          >
            <Sun className={`w-3.5 h-3.5 ${isSeniorMode ? 'text-mint animate-pulse' : 'text-teal-dark'}`} />
            <span className="hidden sm:inline">Senior Mode</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSeniorMode ? 'bg-mint text-teal-dark' : 'bg-canvas-subtle'}`}>
              {isSeniorMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Smart Alert Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-full bg-white text-teal-dark border border-teal-dark/15 hover:bg-canvas-subtle transition-all"
            aria-label="View Smart Alerts"
          >
            <Bell className="w-5 h-5 text-teal-dark" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {alertCount}
              </span>
            )}
          </button>

          {/* Active Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-teal-dark/10">
            <img
              src={user?.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
              alt={user?.full_name || "User"}
              className="w-9 h-9 rounded-full object-cover border-2 border-mint"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-teal-dark line-clamp-1">{user?.full_name}</p>
              <span className="text-[10px] uppercase font-semibold text-teal-dark/60 tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
