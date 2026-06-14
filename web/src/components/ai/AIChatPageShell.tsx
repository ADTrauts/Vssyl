'use client';

import React, { useCallback, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import {
  WorkspaceSplitLayout,
  WorkspaceSidebar,
  WorkspaceMain,
} from '@/components/layouts';
import { Button } from 'shared/components';

export interface AIChatPageShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  mobileSidebarOpen: boolean;
  onMobileSidebarOpenChange: (open: boolean) => void;
  /** Label on the mobile bar (Calendar 3C-7B pattern) */
  mobileBarLabel?: string;
}

/**
 * Certified AI chat workspace shell — sidebar | main (Wave 5H-AI-UX-B).
 * Mobile: sidebar hidden by default; sheet overlay below md breakpoint.
 */
export function AIChatPageShell({
  sidebar,
  children,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  mobileBarLabel = 'Conversations',
}: AIChatPageShellProps) {
  const closeMobileSidebar = useCallback(
    () => onMobileSidebarOpenChange(false),
    [onMobileSidebarOpenChange]
  );

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen, closeMobileSidebar]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onMobileSidebarOpenChange(true)}
          aria-label="Open conversations"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {mobileBarLabel}
        </span>
      </div>
      <WorkspaceSplitLayout className="relative min-h-0 flex-1">
        {mobileSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close conversations panel"
            onClick={closeMobileSidebar}
          />
        ) : null}
        <WorkspaceSidebar
          className={`w-[280px] border-r border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 flex shadow-xl md:relative md:shadow-none'
              : 'hidden md:flex'
          }`}
        >
          <div className="relative flex h-full w-full min-h-0 flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10 md:hidden"
              onClick={closeMobileSidebar}
              aria-label="Close conversations panel"
            >
              <X className="h-4 w-4" />
            </Button>
            {sidebar}
          </div>
        </WorkspaceSidebar>
        <WorkspaceMain overflow="hidden" className="flex min-w-0 flex-col">
          {children}
        </WorkspaceMain>
      </WorkspaceSplitLayout>
    </div>
  );
}

export default AIChatPageShell;
