import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({ icon, className, ...props }) => {
  const baseClasses =
    'px-v-3 py-v-2 border border-v-border rounded-v-button bg-v-surface text-v-text-primary placeholder:text-v-text-muted focus:outline-none focus:ring focus:ring-v-primary focus:border-v-primary';

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
      <span className="absolute left-v-3 top-1/2 -translate-y-1/2 text-v-text-muted">{icon}</span>
      <input
        className={`${baseClasses} pl-9 pr-v-3 ${className || ''}`}
        {...props}
      />
    </div>
  );
};
