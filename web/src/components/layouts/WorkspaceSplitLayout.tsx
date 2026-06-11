'use client';

import React from 'react';

const ROOT_CLASS =
  'flex h-full min-h-0 w-full bg-gray-50 dark:bg-gray-900';

const SIDEBAR_CLASS =
  'flex-shrink-0 h-full min-h-0';

const MAIN_OVERFLOW: Record<'hidden' | 'auto', string> = {
  hidden: 'overflow-hidden',
  auto: 'overflow-auto',
};

const MAIN_CLASS_BASE = 'relative flex-1 min-w-0 h-full min-h-0';

const SECONDARY_CLASS =
  'flex-shrink-0 h-full min-h-0';

export interface WorkspaceSplitLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal workspace shell — sidebar | main | optional secondary.
 * Layout structure only; slot children supply module content.
 * Wave 3C-1 — Drive reference pilot.
 */
export function WorkspaceSplitLayout({
  children,
  className = '',
}: WorkspaceSplitLayoutProps) {
  return (
    <div className={`${ROOT_CLASS} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface WorkspacePanelProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/** Left navigation / tree slot */
export function WorkspaceSidebar({
  children,
  className = '',
  ...rest
}: WorkspacePanelProps) {
  return (
    <aside
      className={`${SIDEBAR_CLASS} ${className}`.trim()}
      aria-label="Workspace sidebar"
      {...rest}
    >
      {children}
    </aside>
  );
}

export interface WorkspaceMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Matches Drive outer main (`hidden`) vs inner scroll region (`auto`) */
  overflow?: 'hidden' | 'auto';
}

/** Primary work area */
export function WorkspaceMain({
  children,
  className = '',
  overflow = 'hidden',
  ...rest
}: WorkspaceMainProps) {
  return (
    <div
      className={`${MAIN_CLASS_BASE} ${MAIN_OVERFLOW[overflow]} ${className}`.trim()}
      role="main"
      {...rest}
    >
      {children}
    </div>
  );
}

/** Optional right details / preview slot */
export function WorkspaceSecondary({
  children,
  className = '',
  ...rest
}: WorkspacePanelProps) {
  return (
    <aside
      className={`${SECONDARY_CLASS} ${className}`.trim()}
      aria-label="Workspace details panel"
      {...rest}
    >
      {children}
    </aside>
  );
}
