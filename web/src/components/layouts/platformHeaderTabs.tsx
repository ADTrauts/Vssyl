'use client';

import React, { useMemo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/** Dashboard tab color palette — matches GlobalHeaderTabs / DashboardLayoutInner */
export interface PlatformTabPalette {
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveText: string;
  border: string;
  /** Personal edit-mode "New Tab" dashed button */
  newTabBg: string;
  newTabText: string;
}

export function usePlatformDashboardTabPalette(): PlatformTabPalette {
  const { isDark } = useThemeColors();

  return useMemo(
    () => ({
      activeBg: isDark ? '#0f172a' : '#ffffff',
      activeText: isDark ? '#f8fafc' : '#1f2937',
      inactiveBg: isDark ? '#334155' : '#e5e7eb',
      inactiveText: isDark ? '#cbd5e1' : '#4b5563',
      border: isDark ? '#475569' : '#d1d5db',
      newTabBg: isDark ? '#1e293b' : '#f3f4f6',
      newTabText: isDark ? '#cbd5e1' : '#6b7280',
    }),
    [isDark]
  );
}

export function getPlatformDashboardTabStyle(
  palette: PlatformTabPalette,
  isActive: boolean,
  borderRadius: string,
  marginLeft: number,
  activeColor?: string
): React.CSSProperties {
  const resolvedColor = isActive && activeColor != null ? activeColor : isActive ? palette.activeText : palette.inactiveText;

  return {
    background: isActive ? palette.activeBg : palette.inactiveBg,
    color: resolvedColor,
    borderStyle: 'solid',
    borderColor: palette.border,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 0,
    borderRadius,
    boxSizing: 'border-box',
    minHeight: 44,
    height: 44,
    padding: '0 24px',
    marginLeft,
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  };
}

export interface PlatformDashboardTabProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  isActive: boolean;
  borderRadius: string;
  marginLeft: number;
  /** Override palette (e.g. tests); defaults to usePlatformDashboardTabPalette */
  palette?: PlatformTabPalette;
  /** Place tab indigo override when active */
  activeColor?: string;
  style?: React.CSSProperties;
}

/**
 * Structural dashboard tab button — styling only; routing/state owned by consumer.
 * Wave 3C-4D.1 — foundation (no consumer migration yet).
 */
export function PlatformDashboardTab({
  isActive,
  borderRadius,
  marginLeft,
  palette: paletteProp,
  activeColor,
  children,
  className = '',
  style,
  ...rest
}: PlatformDashboardTabProps) {
  const defaultPalette = usePlatformDashboardTabPalette();
  const palette = paletteProp ?? defaultPalette;
  const tabStyle = getPlatformDashboardTabStyle(palette, isActive, borderRadius, marginLeft, activeColor);

  return (
    <button
      type="button"
      className={className}
      style={{ ...tabStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
