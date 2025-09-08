import React from 'react';

type TopbarProps = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
};

export const Topbar: React.FC<TopbarProps> = ({ left, center, right }) => (
  <header className="w-full h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between transition-colors duration-300">
    <div className="flex items-center gap-2">{left}</div>
    <div className="flex-1 flex justify-center">{center}</div>
    <div className="flex items-center gap-2">{right}</div>
  </header>
); 