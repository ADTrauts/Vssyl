import React from 'react';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer gap-2">
    <span>{label}</span>
    <span className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer left-0 top-0 transition-transform duration-200 ease-in transform checked:translate-x-4"
      />
      <span className={`block overflow-hidden h-6 rounded-full bg-gray-300 transition-colors duration-200 ease-in ${checked ? 'bg-blue-600' : ''}`}></span>
    </span>
  </label>
); 