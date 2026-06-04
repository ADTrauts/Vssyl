import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-v-surface shadow-v-card rounded-v-card p-v-4 border border-v-border ${className}`}>
      {children}
    </div>
  );
};
