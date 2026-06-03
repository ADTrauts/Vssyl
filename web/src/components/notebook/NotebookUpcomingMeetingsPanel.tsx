'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'shared/components';
import { Calendar } from 'lucide-react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';
import { notebookPagePath } from './notebookPaths';

interface NotebookUpcomingMeetingsPanelProps {
  context: NotebookWorkspaceContext;
  basePath: string;
}

function formatWhen(startAt: string): string {
  return new Date(startAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotebookUpcomingMeetingsPanel({
  context,
  basePath,
}: NotebookUpcomingMeetingsPanelProps) {
  const router = useRouter();
  const meetings = context.upcomingMeetings;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Upcoming meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming meetings in the next two weeks.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {meetings.map((m) => (
            <li key={m.id}>
              <div className="font-medium text-gray-900 dark:text-gray-100">{m.title}</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">{formatWhen(m.startAt)}</div>
              {m.pageId && (
                <button
                  type="button"
                  className="text-xs text-blue-700 dark:text-blue-300 hover:underline mt-0.5"
                  onClick={() => router.push(notebookPagePath(basePath, m.pageId!))}
                >
                  {m.pageTitle ?? 'Meeting page'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
