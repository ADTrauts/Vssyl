import React from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  description?: string;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, description }) => (
  <div className="bg-white rounded shadow p-4 flex flex-col items-start min-w-[160px] max-w-xs">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="font-bold text-lg">{value}</span>
      {change && <span className={`ml-2 text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change}</span>}
    </div>
    <div className="text-gray-600 text-sm mb-1">{label}</div>
    {description && <div className="text-gray-400 text-xs">{description}</div>}
  </div>
); 