import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'rose' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const getColors = () => {
    switch (color) {
      case 'indigo': return 'bg-indigo-50 text-indigo-600';
      case 'emerald': return 'bg-emerald-50 text-emerald-600';
      case 'rose': return 'bg-rose-50 text-rose-600';
      case 'amber': return 'bg-amber-50 text-amber-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 min-w-[140px] animate-scale-in transition-transform hover:-translate-y-1 duration-300">
      <div className={`self-start p-2 rounded-xl ${getColors()} mb-2`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{title}</p>
        <h3 className="text-lg font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
};