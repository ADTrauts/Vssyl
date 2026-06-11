'use client';

import React, { useEffect, useState } from 'react';
import { PLATFORM_SHELL_DEFAULTS } from './PlatformShell';

/** Matches GlobalHeaderTabs / DashboardLayoutInner header geometry */
export const PLATFORM_HEADER_DEFAULTS = {
  height: PLATFORM_SHELL_DEFAULTS.headerHeight,
  collapseBelow: PLATFORM_SHELL_DEFAULTS.collapseBelow,
} as const;

export type PlatformHeaderMode = 'personal' | 'business';

const HEADER_ROOT_CLASS =
  'fixed left-0 top-0 z-[100] flex w-screen shrink-0 shadow-[var(--v-shadow-card)]';

const HEADER_INNER_MOBILE_CLASS =
  'flex w-full min-h-0 flex-col items-stretch px-3';

const HEADER_INNER_DESKTOP_CLASS =
  'flex w-full min-h-0 flex-row items-stretch px-8';

const BRAND_CLASS = 'flex shrink-0 items-center gap-4';

const TABS_OUTER_CLASS = 'flex min-w-0 flex-1 justify-center overflow-hidden';

const TABS_OUTER_MOBILE_CLASS = 'mt-2 items-center';

const TABS_OUTER_DESKTOP_CLASS = 'items-end';

const TABS_NAV_CLASS =
  'flex max-w-full gap-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const TABS_NAV_MOBILE_CLASS = 'items-center';

const TABS_NAV_DESKTOP_CLASS = 'items-stretch';

const ACTIONS_CLASS = 'flex shrink-0 items-center gap-3';

const ACTIONS_MOBILE_CLASS = 'mt-2 self-auto';

const ACTIONS_DESKTOP_CLASS = 'self-center';

export interface PlatformHeaderProps {
  mode: PlatformHeaderMode;
  /** Brand slot — logo + title */
  brand: React.ReactNode;
  /** Center tab strip (rendered inside scrollable nav) */
  tabs: React.ReactNode;
  /** Right actions — search, AI, avatar */
  actions: React.ReactNode;
  /** Portals: AIChatDropdown, etc. */
  overlays?: React.ReactNode;
  /** From useThemeColors().getHeaderStyle — consumer supplies branding background */
  headerStyle?: React.CSSProperties;
  /** When omitted, uses usePlatformHeaderMobile (700px breakpoint) */
  isMobile?: boolean;
  className?: string;
}

/** Observes the same 700px breakpoint as GlobalHeaderTabs / DashboardLayoutInner */
export function usePlatformHeaderMobile(
  collapseBelow: number = PLATFORM_HEADER_DEFAULTS.collapseBelow
): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${collapseBelow - 1}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [collapseBelow]);

  return isMobile;
}

export interface PlatformHeaderBrandProps {
  children: React.ReactNode;
  className?: string;
}

/** Left cluster: logo glyph or image + title — content supplied by consumer */
export function PlatformHeaderBrand({ children, className = '' }: PlatformHeaderBrandProps) {
  return <div className={`${BRAND_CLASS} ${className}`.trim()}>{children}</div>;
}

export interface PlatformHeaderTabsRegionProps {
  children: React.ReactNode;
  isMobile?: boolean;
  className?: string;
  /** Override default "Primary navigation" */
  ariaLabel?: string;
}

/** Center flex + scrollable nav landmark */
export function PlatformHeaderTabsRegion({
  children,
  isMobile = false,
  className = '',
  ariaLabel = 'Primary navigation',
}: PlatformHeaderTabsRegionProps) {
  return (
    <div
      className={`${TABS_OUTER_CLASS} ${isMobile ? TABS_OUTER_MOBILE_CLASS : TABS_OUTER_DESKTOP_CLASS} ${className}`.trim()}
    >
      <nav
        aria-label={ariaLabel}
        className={`${TABS_NAV_CLASS} ${isMobile ? TABS_NAV_MOBILE_CLASS : TABS_NAV_DESKTOP_CLASS}`.trim()}
      >
        {children}
      </nav>
    </div>
  );
}

export interface PlatformHeaderActionsProps {
  children: React.ReactNode;
  isMobile?: boolean;
  className?: string;
}

/** Right cluster — search, AI, avatar slots */
export function PlatformHeaderActions({
  children,
  isMobile = false,
  className = '',
}: PlatformHeaderActionsProps) {
  return (
    <div
      className={`${ACTIONS_CLASS} ${isMobile ? ACTIONS_MOBILE_CLASS : ACTIONS_DESKTOP_CLASS} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/**
 * Shared global header frame — brand, tabs, actions slots.
 * Wave 3C-4D.1 — foundation (no consumer migration yet).
 */
export function PlatformHeader({
  mode,
  brand,
  tabs,
  actions,
  overlays,
  headerStyle,
  isMobile: isMobileProp,
  className = '',
}: PlatformHeaderProps) {
  const detectedMobile = usePlatformHeaderMobile();
  const isMobile = isMobileProp ?? detectedMobile;

  return (
    <header
      role="banner"
      data-platform-header-mode={mode}
      className={`${HEADER_ROOT_CLASS} ${isMobile ? 'items-start' : 'items-stretch'} ${className}`.trim()}
      style={{
        height: PLATFORM_HEADER_DEFAULTS.height,
        ...headerStyle,
      }}
    >
      <div
        className={isMobile ? HEADER_INNER_MOBILE_CLASS : HEADER_INNER_DESKTOP_CLASS}
        style={{ minHeight: PLATFORM_HEADER_DEFAULTS.height }}
      >
        {brand}
        <PlatformHeaderTabsRegion isMobile={isMobile}>{tabs}</PlatformHeaderTabsRegion>
        <PlatformHeaderActions isMobile={isMobile}>{actions}</PlatformHeaderActions>
      </div>
      {overlays}
    </header>
  );
}
