'use client';

import Link from 'next/link';
import type { AIExecutionListItem } from 'shared/types';
import { OperationsStatusBadge } from './OperationsStatusBadge';

interface ExecutionExplorerTableProps {
  items: AIExecutionListItem[];
}

export function ExecutionExplorerTable({ items }: ExecutionExplorerTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-v-text-muted py-v-8 text-center">No executions found.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-v-border">
      <table className="min-w-full text-sm">
        <thead className="bg-v-surface-secondary text-left">
          <tr>
            <th className="px-v-3 py-v-2">ID</th>
            <th className="px-v-3 py-v-2">Surface</th>
            <th className="px-v-3 py-v-2">Query</th>
            <th className="px-v-3 py-v-2">Provider</th>
            <th className="px-v-3 py-v-2">Evals</th>
            <th className="px-v-3 py-v-2">Approval</th>
            <th className="px-v-3 py-v-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-v-border hover:bg-v-surface-secondary/50">
              <td className="px-v-3 py-v-2">
                <Link
                  href={`/admin-portal/ai-pipeline/executions/${row.id}`}
                  className="text-v-accent hover:underline font-mono text-xs"
                >
                  {row.id.slice(0, 8)}…
                </Link>
              </td>
              <td className="px-v-3 py-v-2">{row.surface}</td>
              <td className="px-v-3 py-v-2 max-w-xs truncate">{row.userQuery ?? '—'}</td>
              <td className="px-v-3 py-v-2">{row.provider ?? '—'}</td>
              <td className="px-v-3 py-v-2">
                {row.hasOpenEvaluation ? (
                  <OperationsStatusBadge status="PENDING" />
                ) : (
                  row.evaluationCount
                )}
              </td>
              <td className="px-v-3 py-v-2">{row.hasApproval ? 'Yes' : '—'}</td>
              <td className="px-v-3 py-v-2 whitespace-nowrap">
                {new Date(row.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
