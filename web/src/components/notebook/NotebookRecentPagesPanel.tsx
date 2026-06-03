'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from 'shared/components';
import { FileText } from 'lucide-react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';
import { notebookPagePath, notebookViewPath } from './notebookPaths';

interface NotebookRecentPagesPanelProps {
  context: NotebookWorkspaceContext;
  basePath: string;
}

export function NotebookRecentPagesPanel({ context, basePath }: NotebookRecentPagesPanelProps) {
  const router = useRouter();
  const pages = context.recentPages;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Recent pages
      </h2>
      {pages.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No pages yet.</p>
      ) : (
        <ul className="space-y-2">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="text-sm text-blue-700 dark:text-blue-300 hover:underline text-left"
                onClick={() => router.push(notebookPagePath(basePath, p.id))}
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => router.push(notebookViewPath(basePath, 'recent'))}
      >
        View all
      </Button>
    </Card>
  );
}
