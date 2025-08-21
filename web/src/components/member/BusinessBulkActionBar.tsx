'use client';

import React from 'react';
import { Button, Badge } from 'shared/components';
import { Trash2, UserPlus, Settings, Users } from 'lucide-react';

export interface BusinessBulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
}

interface BusinessBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BusinessBulkAction[];
  onClearSelection: () => void;
  className?: string;
}

export const BusinessBulkActionBar: React.FC<BusinessBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className = ''
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} of {totalCount} selected
            </span>
            <Badge color="blue" className="text-xs">
              {Math.round((selectedCount / totalCount) * 100)}%
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex items-center space-x-2"
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </Button>
            );
          })}
          
          <Button
            variant="secondary"
            onClick={onClearSelection}
            className="text-gray-600 hover:text-gray-900"
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}; 