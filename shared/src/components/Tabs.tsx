"use client";

import React from 'react';

type Tab = {
  label: string;
  key: string;
};

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (key: string) => void;
  children: React.ReactNode;
};

export const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange, children }) => {
  return (
    <div>
      <div className="flex border-b mb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px border-b-2 ${value === tab.key ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-600'}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}; 