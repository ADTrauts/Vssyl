'use client';

import React from 'react';
import { Card } from 'shared/components';
import { Lightbulb } from 'lucide-react';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';

interface NotebookInsightsPanelProps {
  context: NotebookWorkspaceContext;
}

const severityClass: Record<string, string> = {
  critical: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30',
  warning: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
  info: 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50',
};

export function NotebookInsightsPanel({ context }: NotebookInsightsPanelProps) {
  const { workspaceInsights, suggestedFocus } = context;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        Suggested focus
      </h2>
      {suggestedFocus.length > 0 && (
        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-4">
          {suggestedFocus.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {workspaceInsights.length > 0 && (
        <div className="space-y-2">
          {workspaceInsights.map((insight) => (
            <div
              key={insight.type}
              className={`text-xs rounded border px-2 py-1.5 ${severityClass[insight.severity] ?? severityClass.info}`}
            >
              {insight.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
