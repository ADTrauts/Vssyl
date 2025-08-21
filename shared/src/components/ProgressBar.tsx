import React from 'react';

type ProgressBarProps = {
  value: number;
  label?: string;
  color?: string;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, color = 'bg-blue-600' }) => (
  <div className="w-full">
    {label && <div className="mb-1 text-xs text-gray-600">{label}</div>}
    <div className="w-full bg-gray-200 rounded h-3">
      <div
        className={`h-3 rounded ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <div className="text-right text-xs text-gray-500 mt-1">{value}%</div>
  </div>
); 