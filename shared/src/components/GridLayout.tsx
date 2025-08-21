import React from 'react';

type GridLayoutProps = {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
};

export const GridLayout: React.FC<GridLayoutProps> = ({ children, columns = 3, gap = 4 }) => {
  return (
    <div
      className={`grid grid-cols-${columns} gap-${gap}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: `${gap * 0.25}rem` }}
    >
      {children}
    </div>
  );
}; 