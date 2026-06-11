'use client';

import React from 'react';
import { PLATFORM_SHELL_DEFAULTS } from './PlatformShell';

const MODULE_BUTTON_BASE_CLASS =
  'flex items-center justify-center w-10 h-10 my-1 rounded-lg transition-colors';

export interface PlatformRightRailProps {
  children: React.ReactNode;
  backgroundColor: string | undefined;
  visible?: boolean;
  headerHeight?: number;
  width?: number;
  className?: string;
}

export interface PlatformRightRailModuleButtonProps {
  isActive: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  /** Purple highlight for AI chat */
  variant?: 'default' | 'purple';
}

/**
 * Shared 40px fixed right quick-access rail frame.
 * Wave 3C-4B — extracted from DashboardLayoutInner + DashboardLayoutWrapper.
 */
export function PlatformRightRail({
  children,
  backgroundColor,
  visible = true,
  headerHeight = PLATFORM_SHELL_DEFAULTS.headerHeight,
  width = PLATFORM_SHELL_DEFAULTS.rightRailWidth,
  className = '',
}: PlatformRightRailProps) {
  return (
    <aside
      className={className}
      style={{
        width,
        background: backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        gap: 12,
        flexShrink: 0,
        position: 'fixed',
        right: 0,
        top: headerHeight,
        height: `calc(100vh - ${headerHeight}px)`,
        zIndex: 1000,
        boxShadow: '0 0 8px rgba(0,0,0,0.04)',
        transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
        overflow: 'hidden',
        visibility: visible ? 'visible' : 'hidden',
        opacity: visible ? 1 : 0,
      }}
      aria-label="Quick access"
    >
      {children}
    </aside>
  );
}

/** Standard module icon button on the right rail */
export function PlatformRightRailModuleButton({
  isActive,
  onClick,
  title,
  children,
  variant = 'default',
}: PlatformRightRailModuleButtonProps) {
  const isPurple = variant === 'purple';
  const activeBackground = isPurple ? '#9333ea' : '#1f2937';
  const inactiveClass = isPurple ? 'hover:bg-gray-700' : 'hover:bg-gray-700';

  return (
    <button
      type="button"
      className={`${MODULE_BUTTON_BASE_CLASS} ${isActive ? (isPurple ? 'bg-purple-600 text-white' : 'bg-gray-800 text-white') : `${inactiveClass} text-gray-300`}`}
      style={{
        background: isActive ? activeBackground : 'transparent',
        color: isActive ? '#fff' : '#cbd5e1',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        margin: '8px 0',
        borderRadius: 8,
        transition: 'background 0.18s cubic-bezier(.4,1.2,.6,1)',
      }}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

/** Pushes bottom rail actions to the foot of the rail */
export function PlatformRightRailSpacer() {
  return <div className="flex-1" />;
}
