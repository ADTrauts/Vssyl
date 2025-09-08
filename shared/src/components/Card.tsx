import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}; 