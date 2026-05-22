'use client';

import React, { useState } from 'react';
import { Alert, Button, Spinner } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { ModuleContextProviderHealthReport } from '../../../types/adminAiPipeline';

function statusBadge(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'unhealthy':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
}

export default function ContextProviderHealthPanel() {
  const [userId, setUserId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ModuleContextProviderHealthReport | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await adminApiService.runModuleContextProviderHealthCheck({
        ...(userId.trim() ? { userId: userId.trim() } : {}),
        ...(moduleId.trim() ? { moduleId: moduleId.trim() } : {}),
        ...(businessId.trim() ? { businessId: businessId.trim() } : {}),
      });
      if (res.error || !res.data) {
        setError(res.error ?? 'Health check failed');
        return;
      }
      setReport(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Module context provider health
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Dry-run probe of registered context provider endpoints (no cache write). Use for
            certification and pipeline debugging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target user ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="Defaults to admin user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Module ID (optional)
            </label>
            <input
              type="text"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="e.g. drive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business ID (HR / scheduling)
            </label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="Required for business-scoped modules"
            />
          </div>
        </div>

        <Button onClick={runCheck} disabled={loading}>
          {loading ? 'Checking…' : 'Run provider health check'}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Spinner size="sm" />
          Probing endpoints…
        </div>
      )}

      {report && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>{report.summary.healthy}</strong> healthy
            </span>
            <span>
              <strong>{report.summary.unhealthy}</strong> unhealthy
            </span>
            <span>
              <strong>{report.summary.skipped}</strong> skipped
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              checked {new Date(report.checkedAt).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2 pr-4">Module</th>
                  <th className="py-2 pr-4">Provider</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Latency</th>
                  <th className="py-2 pr-4">Payload</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((row) => (
                  <tr
                    key={`${row.moduleId}:${row.providerName}`}
                    className="border-b border-gray-100 dark:border-slate-800"
                  >
                    <td className="py-2 pr-4 font-medium">{row.moduleName}</td>
                    <td className="py-2 pr-4">{row.providerName}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {row.latencyMs != null ? `${row.latencyMs} ms` : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {row.payloadBytesEstimate != null
                        ? `${row.payloadBytesEstimate} B${row.payloadOverLimit ? ' ⚠' : ''}`
                        : '—'}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {row.skipReason ??
                        row.failureMessage ??
                        (row.certificationIssues.length > 0
                          ? row.certificationIssues.map((i) => i.message).join('; ')
                          : 'OK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
