import React from 'react';

type BadgeProps = {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const colorMap = {
  gray: 'bg-gray-200 text-gray-800',
  blue: 'bg-blue-200 text-blue-800',
  green: 'bg-green-200 text-green-800',
  red: 'bg-red-200 text-red-800',
  yellow: 'bg-yellow-200 text-yellow-800',
};

const sizeMap = {
  sm: 'px-1 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  color = 'gray', 
  size = 'md',
  className = ''
}) => {
  return (
    <span className={`inline-block rounded font-semibold ${colorMap[color]} ${sizeMap[size]} ${className}`}>
      {children}
    </span>
  );
}; 