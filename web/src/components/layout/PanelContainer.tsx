import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PanelContextType = {
  collapsedPanels: Record<string, boolean>;
  togglePanel: (panelId: string) => void;
  setPanelWidth: (panelId: string, width: number) => void;
  panelWidths: Record<string, number>;
};

const PanelContext = createContext<PanelContextType>({
  collapsedPanels: {},
  togglePanel: () => {},
  setPanelWidth: () => {},
  panelWidths: {},
});

export const usePanel = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel must be used within a PanelContainer');
  }
  return context;
};

type PanelProps = {
  id: string;
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  resizable?: boolean;
};

export const Panel = ({
  id,
  children,
  defaultWidth = 240,
  minWidth = 200,
  maxWidth = 600,
  className,
  resizable = true,
}: PanelProps) => {
  const { collapsedPanels, togglePanel, setPanelWidth, panelWidths } = usePanel();
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!panelRef.current || !resizable) return;

    const panel = panelRef.current;
    const resizer = resizerRef.current;
    if (!resizer) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.pageX;
      const startWidth = panel.offsetWidth;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const newWidth = Math.min(
          Math.max(startWidth + e.pageX - startX, minWidth),
          maxWidth
        );
        setPanelWidth(id, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    resizer.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizer.removeEventListener('mousedown', handleMouseDown);
    };
  }, [id, isResizing, maxWidth, minWidth, resizable, setPanelWidth]);

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex h-full',
        collapsedPanels[id] && 'w-14',
        className
      )}
      style={
        !collapsedPanels[id]
          ? {
              width: panelWidths[id] || defaultWidth,
              minWidth: collapsedPanels[id] ? 56 : minWidth,
              maxWidth,
            }
          : undefined
      }
    >
      {children}
      {resizable && !collapsedPanels[id] && (
        <div
          ref={resizerRef}
          className={cn(
            'absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50',
            isResizing && 'bg-blue-500'
          )}
        />
      )}
    </div>
  );
};

type PanelContainerProps = {
  children: ReactNode;
  className?: string;
};

export const PanelContainer = ({ children, className }: PanelContainerProps) => {
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({});
  const [panelWidths, setPanelWidths] = useState<Record<string, number>>({});

  const togglePanel = (panelId: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  };

  const setPanelWidth = (panelId: string, width: number) => {
    setPanelWidths(prev => ({
      ...prev,
      [panelId]: width,
    }));
  };

  return (
    <PanelContext.Provider
      value={{
        collapsedPanels,
        togglePanel,
        setPanelWidth,
        panelWidths,
      }}
    >
      <div className={cn('flex h-full w-full overflow-hidden', className)}>
        {children}
      </div>
    </PanelContext.Provider>
  );
}; 