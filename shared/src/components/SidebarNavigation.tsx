import React from 'react';

type SidebarItem = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

type SidebarNavigationProps = {
  items: SidebarItem[];
};

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ items }) => (
  <nav className="h-full w-56 bg-gray-900 text-white flex flex-col py-4">
    {items.map((item) => (
      <button
        key={item.label}
        className={`flex items-center px-4 py-2 text-left hover:bg-gray-800 rounded transition ${item.active ? 'bg-gray-800 font-bold' : ''}`}
        onClick={item.onClick}
      >
        {item.icon && <span className="mr-3">{item.icon}</span>}
        {item.label}
      </button>
    ))}
  </nav>
); 