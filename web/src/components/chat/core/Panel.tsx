'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePanels } from './PanelContainer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BasePanelProps } from './types';
import { Button } from '@/components/ui/button';

interface PanelProps extends BasePanelProps {
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  id,
  children,
  className,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  position = 'left',
  onResize,
  onCollapse,
}) => {
  const { isPanelCollapsed, togglePanel, panelWidths, setPanelWidth } = usePanels();
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const isCollapsed = isPanelCollapsed(id);
  const currentWidth = panelWidths[id] || defaultWidth;

  useEffect(() => {
    if (!panelWidths[id]) {
      setPanelWidth(id, defaultWidth);
    }
  }, [id, defaultWidth, panelWidths, setPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (position === 'left') {
        newWidth = e.clientX - panelRect.left;
      } else {
        newWidth = panelRect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setPanelWidth(id, newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, id, minWidth, maxWidth, position, setPanelWidth, onResize]);

  const handleCollapse = () => {
    togglePanel(id);
    onCollapse?.(!isCollapsed);
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex h-full shrink-0 transition-[width] duration-300 ease-in-out',
        isCollapsed ? 'w-0' : 'w-[var(--panel-width)]',
        className
      )}
      style={{ '--panel-width': `${currentWidth}px` } as React.CSSProperties}
    >
      <div className="relative flex h-full w-full overflow-hidden bg-muted/10">
        {!isCollapsed && children}
      </div>

      <div
        ref={resizeHandleRef}
        className={cn(
          'absolute top-0 z-50 h-full w-1 cursor-col-resize hover:bg-primary/50',
          position === 'left' ? 'right-0' : 'left-0'
        )}
        onMouseDown={() => setIsResizing(true)}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={currentWidth}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-label="Resize panel"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className={cn(
          'absolute top-1/2 z-50 h-12 w-6 -translate-y-1/2 rounded-md',
          position === 'left'
            ? 'right-0 translate-x-full'
            : 'left-0 -translate-x-full'
        )}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {position === 'left' ? (
          isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )
        ) : isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}; 