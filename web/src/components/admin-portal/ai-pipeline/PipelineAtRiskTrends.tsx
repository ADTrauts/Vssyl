'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineQualityStats } from '../../../types/adminAiPipeline';

export default function PipelineAtRiskTrends({
  stats,
  loading,
}: {
  stats: PipelineQualityStats | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-v-border rounded-lg p-4 animate-pulse bg-v-surface h-full min-h-[200px]">
        <div className="h-4 w-32 bg-v-surface-muted rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-v-surface-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.byDay.length === 0) {
    return (
      <div className="border border-v-border rounded-lg p-4 bg-v-surface h-full">
        <h2 className="text-lg font-semibold text-v-text-primary mb-2">At-risk trends</h2>
        <p className="text-sm text-v-text-muted">No daily risk data in this window.</p>
      </div>
    );
  }

  const recent = stats.byDay.slice(-7);

  return (
    <div className="border border-v-border rounded-lg p-4 bg-v-surface h-full">
      <h2 className="text-lg font-semibold text-v-text-primary mb-3">At-risk trends</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-v-text-muted">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2">At risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {recent.map((row) => (
              <tr key={row.date}>
                <td className="py-2 pr-4 text-v-text-primary">{row.date}</td>
                <td className="py-2 pr-4 text-v-text-secondary">{row.total}</td>
                <td className="py-2">
                  <Badge
                    className={
                      row.atRisk > 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {row.atRisk}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.topIssues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-v-border">
          <p className="text-xs font-medium text-v-text-muted mb-2">Top issues</p>
          <ul className="text-xs text-v-text-secondary space-y-1">
            {stats.topIssues.slice(0, 3).map((item) => (
              <li key={item.issue} className="truncate" title={item.issue}>
                {item.issue} ({item.count})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
