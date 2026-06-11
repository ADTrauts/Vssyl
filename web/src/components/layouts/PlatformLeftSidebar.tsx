'use client';

import React from 'react';
import { PLATFORM_SHELL_DEFAULTS } from './PlatformShell';

const SIDEBAR_PADDING = '20px 0';

export interface PlatformLeftSidebarProps {
  children: React.ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  backgroundColor: string | undefined;
  /** When false, sidebar width is 0 and collapse control is hidden off-screen */
  visible?: boolean;
  width?: number;
  customizeTextColor: string | undefined;
  customizeBorderColor: string;
  onCustomizeClick: () => void;
  /** Wrapper uses paddingTop: 20 on customize footer */
  customizeFooterPaddingTop?: number | string;
  collapseButtonBorderColor?: string;
  className?: string;
}

function CollapseChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Shared left navigation frame — collapse control, aside shell, customize footer.
 * Nav content (folders, modules) supplied by consumer via children.
 * Wave 3C-4B — extracted from DashboardLayoutInner + DashboardLayoutWrapper.
 */
export function PlatformLeftSidebar({
  children,
  collapsed,
  onToggleCollapse,
  backgroundColor,
  visible = true,
  width = PLATFORM_SHELL_DEFAULTS.leftNavWidth,
  customizeTextColor,
  customizeBorderColor,
  onCustomizeClick,
  customizeFooterPaddingTop,
  collapseButtonBorderColor = '#555',
  className = '',
}: PlatformLeftSidebarProps) {
  const resolvedWidth = visible ? (collapsed ? 0 : width) : 0;
  const collapseButtonLeft = !visible
    ? -100
    : collapsed
      ? 0
      : width - PLATFORM_SHELL_DEFAULTS.collapseControlOffset;
  const contentVisible = visible && !collapsed;

  return (
    <aside
      className={className}
      style={{
        width: resolvedWidth,
        background: backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        padding: SIDEBAR_PADDING,
        flexShrink: 0,
        transition: 'width 0.2s ease-in-out',
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        style={{
          position: 'fixed',
          top: '50%',
          left: collapseButtonLeft,
          transform: 'translateY(-50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#444',
          color: '#fff',
          border: `1px solid ${collapseButtonBorderColor}`,
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'left 0.2s ease-in-out',
        }}
      >
        <CollapseChevron collapsed={collapsed} />
      </button>

      <div
        style={{
          visibility: contentVisible ? 'visible' : 'hidden',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.2s, visibility 0.2s',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}

        <div
          style={{
            marginTop: 'auto',
            ...(customizeFooterPaddingTop != null ? { paddingTop: customizeFooterPaddingTop } : {}),
          }}
        >
          <button
            type="button"
            onClick={onCustomizeClick}
            style={{
              width: '100%',
              background: 'none',
              border: `1px solid ${customizeBorderColor}`,
              color: customizeTextColor,
              padding: '8px 0',
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Customize
          </button>
        </div>
      </div>
    </aside>
  );
}
