'use client';

import React from 'react';

/** Matches DashboardLayoutInner / DashboardLayoutWrapper geometry */
export const PLATFORM_SHELL_DEFAULTS = {
  headerHeight: 64,
  leftNavWidth: 240,
  rightRailWidth: 40,
  collapseBelow: 700,
  collapseControlOffset: 12,
} as const;

const ROOT_CLASS =
  'relative h-screen w-screen min-h-0 bg-[var(--v-color-background)] text-[var(--v-color-text-primary)]';

const BODY_CLASS = 'absolute inset-x-0 bottom-0 flex min-h-0 overflow-hidden';

const HEADER_CLASS =
  'fixed left-0 top-0 z-[100] w-screen shrink-0 shadow-sm';

const LEFT_NAV_CLASS =
  'relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-in-out';

const MAIN_CLASS =
  'relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-gray-50 text-gray-900 transition-[padding] duration-200 ease-in-out dark:bg-gray-900 dark:text-gray-100';

const RIGHT_RAIL_CLASS =
  'fixed z-[100] flex shrink-0 flex-col items-center overflow-hidden shadow-sm transition-[opacity,visibility] duration-200 ease-in-out';

const COLLAPSE_BUTTON_CLASS =
  'fixed z-[1000] flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-white shadow-sm transition-[left] duration-200 ease-in-out hover:bg-gray-600';

export type PlatformShellMode = 'personal' | 'business';

export type PlatformShellDimensionVars = React.CSSProperties & {
  '--platform-header-height'?: string;
  '--platform-left-nav-width'?: string;
  '--platform-right-rail-width'?: string;
};

export interface PlatformShellProps {
  /** Personal vs business — styling hook only in 3C-4A */
  mode: PlatformShellMode;
  /** Main content slot */
  children: React.ReactNode;
  /** Fixed header chrome (tabs, brand, actions supplied by consumer) */
  header?: React.ReactNode;
  /** Left navigation slot (module tree, folders, etc.) */
  leftNav?: React.ReactNode;
  /** Right quick-access rail slot (dashboard, AI, trash, etc.) */
  rightRail?: React.ReactNode;
  /** Show left navigation region (false for Work tab full-bleed) */
  showLeftNav?: boolean;
  /** Show right rail region (false for Work tab full-bleed) */
  showRightRail?: boolean;
  /** Collapse left nav to zero width */
  leftNavCollapsed?: boolean;
  /** When provided, renders structural collapse control */
  onLeftNavToggle?: () => void;
  /** px — default 64 */
  headerHeight?: number;
  /** px — default 240 */
  leftNavWidth?: number;
  /** px — default 40 */
  rightRailWidth?: number;
  /** Documented breakpoint for consumer responsive collapse — default 700 */
  collapseBelow?: number;
  /**
   * When true, leftNav/rightRail render directly (e.g. PlatformLeftSidebar / PlatformRightRail)
   * without PlatformShellLeftNav / PlatformShellRightRail wrappers.
   */
  useNativePanels?: boolean;
  /**
   * When true, header renders directly (e.g. PlatformHeader with its own landmark)
   * without PlatformShellHeader wrapper — avoids double `<header>` nesting.
   */
  useNativeHeader?: boolean;
  className?: string;
}

function shellDimensionVars(
  headerHeight: number,
  leftNavWidth: number,
  rightRailWidth: number
): PlatformShellDimensionVars {
  return {
    '--platform-header-height': `${headerHeight}px`,
    '--platform-left-nav-width': `${leftNavWidth}px`,
    '--platform-right-rail-width': `${rightRailWidth}px`,
  };
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

export interface PlatformShellHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** px height — default 64 */
  height?: number;
}

/** Fixed top header slot — `role="banner"` */
export function PlatformShellHeader({
  children,
  className = '',
  height = PLATFORM_SHELL_DEFAULTS.headerHeight,
  style,
  ...rest
}: PlatformShellHeaderProps) {
  return (
    <header
      role="banner"
      className={`${HEADER_CLASS} ${className}`.trim()}
      style={{ height, ...style }}
      {...rest}
    >
      {children}
    </header>
  );
}

export interface PlatformShellLeftNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  collapsed?: boolean;
  visible?: boolean;
  width?: number;
}

/** Left navigation slot — landmark nav inside aside */
export function PlatformShellLeftNav({
  children,
  className = '',
  collapsed = false,
  visible = true,
  width = PLATFORM_SHELL_DEFAULTS.leftNavWidth,
  style,
  ...rest
}: PlatformShellLeftNavProps) {
  const resolvedWidth = !visible || collapsed ? 0 : width;

  return (
    <aside
      className={`${LEFT_NAV_CLASS} ${className}`.trim()}
      style={{ width: resolvedWidth, ...style }}
      aria-hidden={!visible || collapsed ? true : undefined}
      {...rest}
    >
      <nav
        className="flex h-full min-h-0 flex-col"
        aria-label="Primary navigation"
        style={{
          visibility: !visible || collapsed ? 'hidden' : 'visible',
          opacity: !visible || collapsed ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
        }}
      >
        {children}
      </nav>
    </aside>
  );
}

export interface PlatformShellMainProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Reserve space for fixed right rail */
  padForRightRail?: boolean;
  rightRailWidth?: number;
}

/** Primary content slot */
export function PlatformShellMain({
  children,
  className = '',
  padForRightRail = true,
  rightRailWidth = PLATFORM_SHELL_DEFAULTS.rightRailWidth,
  style,
  ...rest
}: PlatformShellMainProps) {
  return (
    <main
      className={`${MAIN_CLASS} ${className}`.trim()}
      style={{
        paddingRight: padForRightRail ? rightRailWidth : 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </main>
  );
}

export interface PlatformShellRightRailProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  visible?: boolean;
  headerHeight?: number;
  width?: number;
}

/** Fixed right quick-access rail — `role="complementary"` */
export function PlatformShellRightRail({
  children,
  className = '',
  visible = true,
  headerHeight = PLATFORM_SHELL_DEFAULTS.headerHeight,
  width = PLATFORM_SHELL_DEFAULTS.rightRailWidth,
  style,
  ...rest
}: PlatformShellRightRailProps) {
  return (
    <aside
      role="complementary"
      aria-label="Quick access"
      className={`${RIGHT_RAIL_CLASS} ${className}`.trim()}
      style={{
        top: headerHeight,
        right: 0,
        width,
        height: `calc(100vh - ${headerHeight}px)`,
        visibility: visible ? 'visible' : 'hidden',
        opacity: visible ? 1 : 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </aside>
  );
}

/**
 * Global platform chrome — header + left nav + main + right rail.
 * Structure only; slot children supply tabs, sidebar content, and rails.
 * Wave 3C-4A — foundation (no consumers yet).
 */
export function PlatformShell({
  mode,
  children,
  header,
  leftNav,
  rightRail,
  showLeftNav = true,
  showRightRail = true,
  leftNavCollapsed = false,
  onLeftNavToggle,
  headerHeight = PLATFORM_SHELL_DEFAULTS.headerHeight,
  leftNavWidth = PLATFORM_SHELL_DEFAULTS.leftNavWidth,
  rightRailWidth = PLATFORM_SHELL_DEFAULTS.rightRailWidth,
  collapseBelow: _collapseBelow = PLATFORM_SHELL_DEFAULTS.collapseBelow,
  useNativePanels = false,
  useNativeHeader = false,
  className = '',
}: PlatformShellProps) {
  const dimensionStyle = shellDimensionVars(headerHeight, leftNavWidth, rightRailWidth);
  const showCollapseControl =
    !useNativePanels && showLeftNav && typeof onLeftNavToggle === 'function';
  const collapseButtonLeft = leftNavCollapsed
    ? 0
    : leftNavWidth - PLATFORM_SHELL_DEFAULTS.collapseControlOffset;

  return (
    <div
      className={`${ROOT_CLASS} ${className}`.trim()}
      data-platform-mode={mode}
      data-platform-collapse-below={_collapseBelow}
      style={dimensionStyle}
    >
      {header != null ? (
        useNativeHeader ? (
          header
        ) : (
          <PlatformShellHeader height={headerHeight}>{header}</PlatformShellHeader>
        )
      ) : null}

      <div
        className={BODY_CLASS}
        style={{ top: headerHeight }}
      >
        {leftNav != null && showLeftNav ? (
          useNativePanels ? (
            leftNav
          ) : (
            <PlatformShellLeftNav
              collapsed={leftNavCollapsed}
              visible={showLeftNav}
              width={leftNavWidth}
            >
              {leftNav}
            </PlatformShellLeftNav>
          )
        ) : null}

        {showCollapseControl ? (
          <button
            type="button"
            className={COLLAPSE_BUTTON_CLASS}
            style={{
              top: `calc(${headerHeight}px + (100vh - ${headerHeight}px) / 2)`,
              left: collapseButtonLeft,
            }}
            onClick={onLeftNavToggle}
            aria-label={leftNavCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!leftNavCollapsed}
          >
            <CollapseChevron collapsed={leftNavCollapsed} />
          </button>
        ) : null}

        <PlatformShellMain
          padForRightRail={showRightRail}
          rightRailWidth={rightRailWidth}
        >
          {children}
        </PlatformShellMain>

        {rightRail != null && showRightRail ? (
          useNativePanels ? (
            rightRail
          ) : (
            <PlatformShellRightRail
              visible={showRightRail}
              headerHeight={headerHeight}
              width={rightRailWidth}
            >
              {rightRail}
            </PlatformShellRightRail>
          )
        ) : null}
      </div>
    </div>
  );
}
