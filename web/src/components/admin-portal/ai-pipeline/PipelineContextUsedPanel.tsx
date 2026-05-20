'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, Ban } from 'lucide-react';
import type { AIPipelineTrace, PipelineContextUsedRow } from '../../../types/adminAiPipeline';

function StatusIcon({ status }: { status: PipelineContextUsedRow['status'] }) {
  switch (status) {
    case 'used':
      return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
    case 'planned':
      return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'disabled':
      return <Ban className="w-4 h-4 text-gray-400 shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

function statusLabel(status: PipelineContextUsedRow['status']): string {
  switch (status) {
    case 'used':
      return 'Used';
    case 'planned':
      return 'Planned';
    case 'disabled':
      return 'Disabled';
    default:
      return 'Not used';
  }
}

export default function PipelineContextUsedPanel({ trace }: { trace: AIPipelineTrace }) {
  const rows = trace.insights?.contextUsed ?? [];

  if (rows.length === 0) {
    return (
      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Context actually used</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">No context breakdown available.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Context actually used</h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-start gap-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
          >
            <StatusIcon status={row.status} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{row.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{statusLabel(row.status)}</span>
                {row.itemCount != null && row.itemCount > 0 && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    {row.itemCount} item{row.itemCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              {row.statusReason && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{row.statusReason}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
