'use client';

import React from 'react';
import { Card } from 'shared/components';
import { File } from 'lucide-react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';

interface NotebookRecentFilesPanelProps {
  context: NotebookWorkspaceContext;
}

export function NotebookRecentFilesPanel({ context }: NotebookRecentFilesPanelProps) {
  const files = context.recentFiles;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <File className="w-4 h-4" />
        Recent files
      </h2>
      {files.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No recent files in this workspace.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {files.map((f) => (
            <li key={f.id} className="truncate text-gray-700 dark:text-gray-300">
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
