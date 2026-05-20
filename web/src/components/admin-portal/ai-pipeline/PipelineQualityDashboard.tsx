'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Spinner, Alert, Button, Badge } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { PipelineQualityStats } from '../../../types/adminAiPipeline';
import { PipelineWeakPhrasesEditor } from './PipelinePolicyEditors';
import PipelineEnforcementSettingsEditor from './PipelineEnforcementSettings';
import { usePipelineCatalog } from './usePipelineCatalog';

export default function PipelineQualityDashboard() {
  const { catalog, loading: catalogLoading, error: catalogError, reload } = usePipelineCatalog();
  const [stats, setStats] = useState<PipelineQualityStats | null>(null);
  const [days, setDays] = useState(7);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getAiPipelineQualityStats({
      days,
      ...(userIdFilter.trim() ? { userId: userIdFilter.trim() } : {}),
    });
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load quality stats');
      setStats(null);
    } else {
      setStats(res.data);
    }
    setLoading(false);
  }, [days, userIdFilter]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-8">
      {catalog?.enforcement && (
        <PipelineEnforcementSettingsEditor
          enforcement={catalog.enforcement}
          onSaved={() => void reload()}
        />
      )}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time range (days)
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            User ID (optional)
          </label>
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <Button variant="secondary" onClick={() => void loadStats()}>
          Refresh
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total traces" value={String(stats.totalTraces)} />
            <StatCard
              label="At-risk responses"
              value={`${stats.atRiskCount} (${stats.atRiskPercent}%)`}
              highlight={stats.atRiskPercent > 20}
            />
            <StatCard label="Grounding required" value={String(stats.groundingRequiredCount)} />
            <StatCard label="Retrieval misses" value={String(stats.retrievalMissCount)} highlight />
          </div>

          {stats.byDay.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Risk by day
              </h2>
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Date</th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Total</th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">At risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600 bg-white dark:bg-slate-800">
                    {stats.byDay.map((row) => (
                      <tr key={row.date}>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.date}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{row.total}</td>
                        <td className="px-4 py-2">
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
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Top issues
              </h2>
              {stats.topIssues.length === 0 ? (
                <p className="text-gray-700 dark:text-gray-300 text-sm">No issues recorded yet.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {stats.topIssues.map((item) => (
                    <li key={item.issue} className="flex justify-between gap-2">
                      <span>{item.issue}</span>
                      <Badge className="bg-gray-100 text-gray-800 shrink-0">{item.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Intents with risk
              </h2>
              {stats.intentsAtRisk.length === 0 ? (
                <p className="text-gray-700 dark:text-gray-300 text-sm">No at-risk intents yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.intentsAtRisk.map((item) => (
                    <li key={item.intent} className="flex justify-between gap-2 text-sm">
                      <span className="font-mono text-indigo-700 dark:text-indigo-300">
                        {item.intent}
                      </span>
                      <Badge className="bg-red-100 text-red-800">{item.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : (
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          No persisted diagnostics yet. Twin responses populate this dashboard after the migration
          is applied.
        </p>
      )}

      {catalogError && <Alert>{catalogError}</Alert>}
      {catalogLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        catalog && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Monitored generic phrases
            </h2>
            <PipelineWeakPhrasesEditor
              phrases={catalog.weakGenericPhrases}
              onSaved={() => void reload()}
            />
          </section>
        )
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          : 'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}
