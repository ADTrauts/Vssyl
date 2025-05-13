import type { ReactNode } from 'react';

export type PanelPosition = 'left' | 'right';

export interface BasePanelProps {
  id: string;
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  position?: PanelPosition;
  onResize?: (width: number) => void;
  onCollapse?: (collapsed: boolean) => void;
}

export interface PanelState {
  isCollapsed: boolean;
  width: number;
}

export interface PanelAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export type PanelSize = 'sm' | 'md' | 'lg' | 'xl';

export const PANEL_SIZES: Record<PanelSize, number> = {
  sm: 240,
  md: 320,
  lg: 400,
  xl: 480,
} as const; 