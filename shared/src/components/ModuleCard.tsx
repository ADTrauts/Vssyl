import React from 'react';

type ModuleCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-start min-w-[200px] max-w-xs border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</span>
    </div>
    {description && <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">{description}</div>}
    <div className="w-full">{children}</div>
  </div>
); 