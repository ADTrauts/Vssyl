'use client';

import React, { useCallback, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDashboard } from '@/contexts/DashboardContext';
import { NotebookSidebar, type NotebookView } from './NotebookSidebar';
import { NotebookHome } from './NotebookHome';
import { NotebookPageList } from './NotebookPageList';
import { NotebookTemplatesView } from './NotebookTemplatesView';
import { NotebookTasksPanel } from './NotebookTasksPanel';
import { NotesModule } from '../notes/NotesModule';
import { NotebookPromoteToTask } from './NotebookPromoteToTask';
import { NotebookPageLinksRail } from './NotebookPageLinksRail';

interface NotebookShellProps {
  businessId?: string | null;
  dashboardId?: string | null;
  pageId?: string | null;
}

function resolveContentView(
  pathname: string,
  searchParams: { get: (key: string) => string | null } | null
): NotebookView {
  if (pathname.includes('/page/')) return 'pages';
  const v = searchParams?.get('view');
  if (v === 'recent' || v === 'favorites' || v === 'pages' || v === 'templates' || v === 'tasks' || v === 'shared' || v === 'trash') {
    return v;
  }
  return 'home';
}

export function NotebookShell({ businessId, dashboardId: dashboardIdProp, pageId }: NotebookShellProps) {
  const { currentDashboardId } = useDashboard();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const effectiveDashboardId = dashboardIdProp || currentDashboardId;
  const view = resolveContentView(pathname, searchParams);
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);
  const [linksRefreshKey, setLinksRefreshKey] = useState(0);
  const refreshTasks = useCallback(() => setTasksRefreshKey((k) => k + 1), []);
  const refreshLinks = useCallback(() => setLinksRefreshKey((k) => k + 1), []);
  const onTaskCreatedFromPage = useCallback(() => {
    refreshTasks();
    refreshLinks();
  }, [refreshTasks, refreshLinks]);

  if (!effectiveDashboardId) {
    return (
      <div className="p-6 text-gray-700 dark:text-gray-300">
        <p>Select a dashboard to open Notebook.</p>
      </div>
    );
  }

  const editorToolbar = pageId ? (
    <NotebookPromoteToTask
      dashboardId={effectiveDashboardId}
      businessId={businessId}
      pageId={pageId}
      onTaskCreated={onTaskCreatedFromPage}
    />
  ) : null;

  let main: React.ReactNode;
  if (pageId) {
    main = (
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex-1 min-h-0 min-w-0">
          <NotesModule
            dashboardId={effectiveDashboardId}
            businessId={businessId}
            editorOnly
            pageId={pageId}
            usePageLabels
            editorToolbarExtra={editorToolbar}
          />
        </div>
        <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-700 flex flex-col max-h-[50vh] lg:max-h-none min-h-0">
          <NotebookPageLinksRail
            pageId={pageId}
            linksRefreshKey={linksRefreshKey}
            onTasksChanged={onTaskCreatedFromPage}
          />
          <div className="p-2 border-t border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100 shrink-0">
            Tasks on this dashboard
          </div>
          <div className="min-h-0 max-h-48 overflow-hidden flex flex-col shrink-0">
            <NotebookTasksPanel
              key={tasksRefreshKey}
              dashboardId={effectiveDashboardId}
              businessId={businessId}
              compact
            />
          </div>
        </div>
      </div>
    );
  } else if (view === 'home') {
    main = <NotebookHome dashboardId={effectiveDashboardId} businessId={businessId} />;
  } else if (view === 'templates') {
    main = <NotebookTemplatesView dashboardId={effectiveDashboardId} businessId={businessId} />;
  } else if (view === 'tasks') {
    main = <NotebookTasksPanel dashboardId={effectiveDashboardId} businessId={businessId} />;
  } else if (view === 'trash') {
    main = (
      <div className="p-6 text-gray-700 dark:text-gray-300">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Trash</h1>
        <p className="text-sm">
          Trashed pages use Global Trash in a future phase. Open a page and delete it to soft-remove; restore via
          platform trash when available.
        </p>
      </div>
    );
  } else if (view === 'recent' || view === 'favorites' || view === 'pages' || view === 'shared') {
    main = (
      <NotebookPageList
        dashboardId={effectiveDashboardId}
        businessId={businessId}
        mode={view === 'pages' ? 'pages' : view}
      />
    );
  } else {
    main = <NotebookHome dashboardId={effectiveDashboardId} businessId={businessId} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row bg-white dark:bg-slate-800">
      <NotebookSidebar businessId={businessId} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">{main}</div>
    </div>
  );
}
