import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({ icon, className, ...props }) => {
  const baseClasses = 'px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500';

  if (!icon) {
    return (
      <input
        className={`${baseClasses} ${className || ''}`}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">{icon}</span>
      <input
        className={`${baseClasses} pl-9 pr-3 ${className || ''}`}
        {...props}
      />
    </div>
  );
};