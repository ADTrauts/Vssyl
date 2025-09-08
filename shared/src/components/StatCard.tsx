import React from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  description?: string;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, description }) => (
  <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-start min-w-[160px] max-w-xs border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{value}</span>
      {change && <span className={`ml-2 text-sm ${change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{change}</span>}
    </div>
    <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">{label}</div>
    {description && <div className="text-gray-400 dark:text-gray-500 text-xs">{description}</div>}
  </div>
); 