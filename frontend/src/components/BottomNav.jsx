import React from 'react';
import { 
  LayoutDashboard, 
  GitCompare, 
  TrendingUp, 
  Pill, 
  FolderHeart, 
  Target,
  UserPlus
} from 'lucide-react';

export const BottomNav = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'meds', label: 'Meds', icon: Pill },
    { id: 'records', label: 'Records', icon: FolderHeart },
    { id: 'targets', label: 'My Targets', icon: Target },
    { id: 'consent', label: 'Caregiver', icon: UserPlus },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-2xl">
      <div className="bg-teal-dark/95 backdrop-blur-md text-white rounded-full p-2 px-3 shadow-float border border-mint/20 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-mint text-teal-dark font-bold shadow-pill scale-105'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-dark stroke-[2.5]' : 'text-white/80'}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
