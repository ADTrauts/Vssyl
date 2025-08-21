import React from 'react';

type TopbarProps = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
};

export const Topbar: React.FC<TopbarProps> = ({ left, center, right }) => (
  <header className="w-full h-14 bg-white border-b flex items-center px-4 justify-between">
    <div className="flex items-center gap-2">{left}</div>
    <div className="flex-1 flex justify-center">{center}</div>
    <div className="flex items-center gap-2">{right}</div>
  </header>
); 