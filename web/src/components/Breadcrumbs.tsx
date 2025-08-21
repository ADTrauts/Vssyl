'use client';

import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Button } from 'shared/components';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'dashboard' | 'folder';
  dashboardId?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  currentDashboardName?: string;
}

export default function Breadcrumbs({ items, onNavigate, currentDashboardName }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      {/* Dashboard root */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(items[0])}
        className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded"
      >
        <HomeIcon className="w-4 h-4" />
        <span>{currentDashboardName || 'Drive'}</span>
      </Button>

      {/* Folder path */}
      {items.slice(1).map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item)}
            className={`hover:bg-gray-100 px-2 py-1 rounded ${
              index === items.length - 2 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-600'
            }`}
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
} 