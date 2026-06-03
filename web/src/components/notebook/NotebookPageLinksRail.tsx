'use client';

import React from 'react';
import { NotebookLinkedTasksPanel } from './NotebookLinkedTasksPanel';
import { NotebookLinkedFilesPanel } from './NotebookLinkedFilesPanel';
import { NotebookLinkedEventsPanel } from './NotebookLinkedEventsPanel';
import { NotebookAIPanel } from './NotebookAIPanel';

interface NotebookPageLinksRailProps {
  pageId: string;
  linksRefreshKey?: number;
  onTasksChanged?: () => void;
}

export function NotebookPageLinksRail({
  pageId,
  linksRefreshKey = 0,
  onTasksChanged,
}: NotebookPageLinksRailProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <NotebookAIPanel pageId={pageId} onTasksChanged={onTasksChanged} />
      <div className="p-2 border-b border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100">
        Linked on this page
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <NotebookLinkedEventsPanel pageId={pageId} refreshKey={linksRefreshKey} />
        <div className="flex-1 min-h-0 flex flex-col border-t border-gray-200 dark:border-slate-700">
          <div className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">Tasks</div>
          <NotebookLinkedTasksPanel pageId={pageId} refreshKey={linksRefreshKey} />
        </div>
        <NotebookLinkedFilesPanel pageId={pageId} refreshKey={linksRefreshKey} />
      </div>
    </div>
  );
}
