'use client';

import React from 'react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';

interface NotebookWorkspaceOverviewProps {
  context: NotebookWorkspaceContext;
}

function greetingLine(name: string | null): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const who = name?.trim() ? `, ${name.trim().split(' ')[0]}` : '';
  return `${part}${who}`;
}

export function NotebookWorkspaceOverview({ context }: NotebookWorkspaceOverviewProps) {
  const meetingsToday = context.workspaceInsights.find((i) => i.type === 'meetings_today')?.count ?? 0;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {greetingLine(context.greetingName)}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your operational workspace at a glance.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Open tasks</span>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{context.openTasks.length}</div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Overdue</span>
          <div
            className={`font-semibold ${context.overdueTasks.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}
          >
            {context.overdueTasks.length}
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Meetings today</span>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{meetingsToday}</div>
        </div>
      </div>
    </div>
  );
}
