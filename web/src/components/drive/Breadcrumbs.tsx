import React from 'react';
import type { BreadcrumbFolder } from '@/types/api';

interface BreadcrumbsProps {
  path: BreadcrumbFolder[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path }) => (
  <nav className="text-sm text-gray-500 mb-2">
    {path.map((folder, idx) => (
      <span key={folder.id}>
        {folder.name}
        {idx < path.length - 1 && ' / '}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs; 