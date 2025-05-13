'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PanelContextType {
  collapsedPanels: Set<string>;
  togglePanel: (panelId: string) => void;
  isPanelCollapsed: (panelId: string) => boolean;
  panelWidths: Record<string, number>;
  setPanelWidth: (panelId: string, width: number) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const usePanels = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanels must be used within a PanelContainer');
  }
  return context;
};

interface PanelContainerProps {
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: string[];
  defaultWidths?: Record<string, number>;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  children,
  className,
  defaultCollapsed = [],
  defaultWidths = {},
}) => {
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(
    new Set(defaultCollapsed)
  );
  const [panelWidths, setPanelWidths] = useState<Record<string, number>>(defaultWidths);

  const togglePanel = useCallback((panelId: string) => {
    setCollapsedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  }, []);

  const isPanelCollapsed = useCallback(
    (panelId: string) => collapsedPanels.has(panelId),
    [collapsedPanels]
  );

  const setPanelWidth = useCallback((panelId: string, width: number) => {
    setPanelWidths((prev) => ({
      ...prev,
      [panelId]: width,
    }));
  }, []);

  return (
    <PanelContext.Provider
      value={{
        collapsedPanels,
        togglePanel,
        isPanelCollapsed,
        panelWidths,
        setPanelWidth,
      }}
    >
      <div
        className={cn(
          'flex h-full w-full overflow-hidden bg-background',
          className
        )}
      >
        {children}
      </div>
    </PanelContext.Provider>
  );
}; 