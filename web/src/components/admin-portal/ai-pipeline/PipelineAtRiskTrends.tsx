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
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 animate-pulse bg-white dark:bg-slate-900 h-full min-h-[200px]">
        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.byDay.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 h-full">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">At-risk trends</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">No daily risk data in this window.</p>
      </div>
    );
  }

  const recent = stats.byDay.slice(-7);

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 h-full">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">At-risk trends</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-400">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2">At risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {recent.map((row) => (
              <tr key={row.date}>
                <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{row.date}</td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.total}</td>
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
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Top issues</p>
          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
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
