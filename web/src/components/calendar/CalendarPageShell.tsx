'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  WorkspaceSplitLayout,
  WorkspaceSidebar,
  WorkspaceMain,
} from '@/components/layouts';
import { Button } from 'shared/components';
import CalendarListSidebar from './CalendarListSidebar';

export interface CalendarPageShellProps {
  header: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  /** EventDrawer, modals, and other overlays rendered outside the scroll region */
  overlays?: React.ReactNode;
  sidebarContextType?: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  sidebarContextId?: string;
  onSidebarCreateEvent?: () => void;
}

/**
 * Certified calendar workspace shell — sidebar | main (Wave 3C-7A/7B).
 * Mobile: sidebar hidden by default; sheet overlay below md breakpoint.
 */
export function CalendarPageShell({
  header,
  toolbar,
  children,
  overlays,
  sidebarContextType,
  sidebarContextId,
  onSidebarCreateEvent,
}: CalendarPageShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const handleSidebarCreate = useCallback(() => {
    onSidebarCreateEvent?.();
    closeMobileSidebar();
  }, [onSidebarCreateEvent, closeMobileSidebar]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen, closeMobileSidebar]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      {toolbar}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open calendars"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Calendars</span>
      </div>
      <WorkspaceSplitLayout className="relative min-h-0 flex-1">
        {mobileSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close calendars panel"
            onClick={closeMobileSidebar}
          />
        ) : null}
        <WorkspaceSidebar
          className={`w-[280px] border-r border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-gray-900 ${
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 flex shadow-xl md:relative md:shadow-none'
              : 'hidden md:flex'
          }`}
        >
          <div className="relative flex h-full w-full flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10 md:hidden"
              onClick={closeMobileSidebar}
              aria-label="Close calendars panel"
            >
              <X className="h-4 w-4" />
            </Button>
            <CalendarListSidebar
              contextType={sidebarContextType}
              contextId={sidebarContextId}
              onCreateEvent={handleSidebarCreate}
              embedded
              onNavigate={closeMobileSidebar}
            />
          </div>
        </WorkspaceSidebar>
        <WorkspaceMain overflow="auto" className="min-w-0 p-4">
          {children}
        </WorkspaceMain>
      </WorkspaceSplitLayout>
      {overlays}
    </div>
  );
}

export default CalendarPageShell;
