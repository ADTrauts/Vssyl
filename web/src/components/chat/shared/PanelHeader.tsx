'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  showMoreMenu?: boolean;
  onMoreClick?: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  actions,
  className,
  showMoreMenu = false,
  onMoreClick,
}) => {
  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b px-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="flex h-5 w-5 items-center">{icon}</div>}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {showMoreMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoreClick}
            className="h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        )}
      </div>
    </div>
  );
}; 