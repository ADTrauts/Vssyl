'use client';

import React, { useEffect, useState } from 'react';
import { Button, Spinner, Alert, Badge } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { SuggestionDryRunResult, SuggestionFunnelMetrics } from '../../../types/adminAiPipeline';

const FIXTURES: Array<{ id: 'meeting_prep' | 'thread_spike' | 'document_upload'; label: string }> = [
  { id: 'meeting_prep', label: 'Meeting prep (calendar + file)' },
  { id: 'thread_spike', label: 'Thread summary (10+ messages)' },
  { id: 'document_upload', label: 'Document upload review' },
];

export default function SuggestionCorrelationDryRunPanel() {
  const [fixtureId, setFixtureId] = useState<'meeting_prep' | 'thread_spike' | 'document_upload'>(
    'meeting_prep'
  );
  const [recentCount, setRecentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionDryRunResult | null>(null);
  const [metrics, setMetrics] = useState<SuggestionFunnelMetrics | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setMetricsLoading(true);
      try {
        const res = await adminApiService.getSuggestionFunnelMetrics(7);
        if (res.data) setMetrics(res.data);
      } catch {
        setMetrics(null);
      } finally {
        setMetricsLoading(false);
      }
    };
    void loadMetrics();
  }, []);

  const runDryRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await adminApiService.runSuggestionCorrelationDryRun({
        fixtureId,
        recentSuggestionCount: recentCount,
      });
      if (res.error || !res.data) {
        setError(res.error ?? 'Dry-run failed');
        return;
      }
      setResult(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Dry-run failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-v-surface border border-v-border rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-v-text-primary">
            Ambient suggestion correlation (dry-run)
          </h2>
          <p className="text-sm text-v-text-muted mt-1">
            Replay fixture domain events through correlation + ranking. No signals or suggestions are
            persisted.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-v-text-secondary mb-1">
              Fixture
            </label>
            <select
              value={fixtureId}
              onChange={(e) =>
                setFixtureId(
                  e.target.value as 'meeting_prep' | 'thread_spike' | 'document_upload'
                )
              }
              className="w-full rounded-lg border border-v-border bg-v-surface px-3 py-2 text-v-text-primary"
            >
              {FIXTURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-v-text-secondary mb-1">
              Recent suggestions (24h sim)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={recentCount}
              onChange={(e) => setRecentCount(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-v-border bg-v-surface px-3 py-2 text-v-text-primary"
            />
          </div>
        </div>

        <Button onClick={runDryRun} disabled={loading}>
          {loading ? 'Running…' : 'Run correlation dry-run'}
        </Button>
      </div>

      {!metricsLoading && metrics && (
        <div className="bg-v-surface border border-v-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Funnel metrics ({metrics.windowDays}d)
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge size="sm" color="blue">
              Created {metrics.totals.created}
            </Badge>
            <Badge size="sm" color="green">
              Accepted {metrics.totals.accepted}
            </Badge>
            <Badge size="sm" color="gray">
              Dismissed {metrics.totals.dismissed}
            </Badge>
            <Badge size="sm" color="yellow">
              Pending {metrics.totals.pending}
            </Badge>
            <Badge size="sm" color="gray">
              Explain {Math.round(metrics.quality.explainabilityCompleteRate * 100)}%
            </Badge>
          </div>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      {result && (
        <div className="bg-v-surface border border-v-border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-sm text-v-text-secondary">{result.description}</p>
            <p className="text-xs text-v-text-muted mt-1">
              Trigger: {result.triggerEvent.type} · Rules evaluated:{' '}
              {result.evaluatedRuleIds.join(', ') || 'none'} · Prior signals:{' '}
              {result.priorSignalCount}
            </p>
          </div>

          {result.candidates.length === 0 ? (
            <p className="text-sm text-v-text-muted">No candidates from fixture.</p>
          ) : (
            <ul className="space-y-3">
              {result.candidates.map((c) => (
                <li
                  key={c.suppressionKey}
                  className="rounded-lg border border-purple-200 dark:border-purple-900/50 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-v-text-primary">{c.suggestionType}</span>
                    <Badge size="sm" color="blue">
                      {c.correlationRuleId}
                    </Badge>
                    <Badge size="sm" color={c.rankingAccepted ? 'green' : 'yellow'}>
                      {c.rankingAccepted ? 'Would create' : c.rankingRejectionReason ?? 'Rejected'}
                    </Badge>
                    <span className="text-xs text-v-text-muted">
                      {Math.round(c.adjustedConfidence * 100)}% conf
                    </span>
                  </div>
                  <p className="text-v-text-secondary">{c.explainSummary}</p>
                  <p className="text-xs text-v-text-muted mt-1">
                    Modules: {c.contextModules.join(', ') || '—'} · Source events:{' '}
                    {c.sourceEventIds.length}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
