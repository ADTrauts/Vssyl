import React from 'react';

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
  active?: boolean;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => (
  <nav className="flex items-center text-sm text-gray-600">
    {items.map((item, idx) => (
      <span key={item.label} className="flex items-center">
        <button
          className={`px-1 ${item.active ? 'font-bold text-blue-600' : 'hover:underline'}`}
          onClick={item.onClick}
          disabled={item.active}
        >
          {item.label}
        </button>
        {idx < items.length - 1 && <span className="mx-1">/</span>}
      </span>
    ))}
  </nav>
); 