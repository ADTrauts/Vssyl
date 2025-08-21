import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  margin?: number | string;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', margin = 16, className }) => (
  orientation === 'vertical' ? (
    <div
      className={className}
      style={{ width: 1, height: '100%', background: '#eee', margin: `0 ${margin}` }}
    />
  ) : (
    <div
      className={className}
      style={{ height: 1, width: '100%', background: '#eee', margin: `${margin} 0` }}
    />
  )
);

export default Divider; 