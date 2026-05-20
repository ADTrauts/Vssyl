'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Alert, Spinner } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { PipelineRetentionSettings } from '../../../types/adminAiPipeline';

export default function PipelineCompliancePanel() {
  const [retention, setRetention] = useState<PipelineRetentionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exportDays, setExportDays] = useState(30);
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApiService.getAiPipelineRetention();
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load retention settings');
    } else {
      setRetention(res.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!retention) return;
    setSaving(true);
    setMessage(null);
    const res = await adminApiService.updateAiPipelineRetention(retention);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) setRetention(res.data);
    setMessage('Retention settings saved');
  };

  const runExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    setError(null);
    const res = await adminApiService.exportAiPipelineDiagnostics({
      format,
      days: exportDays,
      atRiskOnly,
    });
    setExporting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (format === 'csv' && typeof res.data === 'string') {
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-pipeline-diagnostics-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('CSV export downloaded');
      return;
    }
    if (res.data && typeof res.data === 'object') {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-pipeline-diagnostics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${(res.data as { count?: number }).count ?? 0} records`);
    }
  };

  const runPurge = async (dryRun: boolean) => {
    setPurging(true);
    setError(null);
    const res = await adminApiService.purgeAiPipelineDiagnostics({ dryRun });
    setPurging(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Purge failed');
      return;
    }
    setMessage(
      dryRun
        ? `Dry run: ${res.data.deleted} row(s) would be deleted (before ${new Date(res.data.cutoff).toLocaleDateString()})`
        : `Deleted ${res.data.deleted} expired diagnostic row(s)`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!retention) {
    return <Alert>{error ?? 'Retention settings unavailable'}</Alert>;
  }

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}

      <section className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Retention policy</h2>
        <label className="block text-sm max-w-xs">
          <span className="text-gray-700 dark:text-gray-300">Keep diagnostics (days)</span>
          <input
            type="number"
            min={7}
            max={365}
            value={retention.diagnosticRetentionDays}
            onChange={(e) =>
              setRetention({
                ...retention,
                diagnosticRetentionDays: Number.parseInt(e.target.value, 10) || 90,
              })
            }
            className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={retention.exportRedactUserMessages}
            onChange={(e) =>
              setRetention({ ...retention, exportRedactUserMessages: e.target.checked })
            }
          />
          Redact user messages in exports
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={retention.exportRedactResponsePreviews}
            onChange={(e) =>
              setRetention({ ...retention, exportRedactResponsePreviews: e.target.checked })
            }
          />
          Redact response previews in exports
        </label>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save retention'}
        </Button>
      </section>

      <section className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Export diagnostics</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Last N days</span>
            <input
              type="number"
              min={1}
              max={90}
              value={exportDays}
              onChange={(e) => setExportDays(Number.parseInt(e.target.value, 10) || 30)}
              className="mt-1 w-24 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
            />
          </label>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={atRiskOnly}
              onChange={(e) => setAtRiskOnly(e.target.checked)}
            />
            At-risk only
          </label>
          <Button variant="secondary" onClick={() => void runExport('json')} disabled={exporting}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={() => void runExport('csv')} disabled={exporting}>
            Export CSV
          </Button>
        </div>
      </section>

      <section className="border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Purge expired</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Deletes persisted diagnostics older than the retention window. Run dry-run first.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void runPurge(true)} disabled={purging}>
            Dry run
          </Button>
          <Button variant="secondary" onClick={() => void runPurge(false)} disabled={purging}>
            Purge now
          </Button>
        </div>
      </section>
    </div>
  );
}
