'use client';

import React from 'react';
import { Card } from 'shared/components';
import { ListTodo } from 'lucide-react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';

interface NotebookOpenTasksPanelProps {
  context: NotebookWorkspaceContext;
}

export function NotebookOpenTasksPanel({ context }: NotebookOpenTasksPanelProps) {
  const tasks = context.openTasks.slice(0, 8);

  return (
    <Card className="p-4 h-full">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <ListTodo className="w-4 h-4" />
        Open tasks
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No open tasks.</p>
      ) : (
        <ul className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
          {tasks.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span className="truncate text-gray-800 dark:text-gray-200">{t.title}</span>
              <span className="text-xs text-gray-500 shrink-0">{t.status}</span>
            </li>
          ))}
        </ul>
      )}
      {context.overdueTasks.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          {context.overdueTasks.length} overdue
        </p>
      )}
    </Card>
  );
}
