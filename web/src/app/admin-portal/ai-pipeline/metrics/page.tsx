'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner, Alert, Card } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { OperationsMetricGrid } from '../../../../components/admin-portal/ai-operations/OperationsMetricGrid';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIOperationsMetricsResponse, AIOperationsWorkflowReport } from 'shared/types';

function TrendTable(props: { title: string; rows: Record<string, number> }) {
  const entries = Object.entries(props.rows).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <Card className="p-v-3">
        <h3 className="text-sm font-semibold mb-v-2">{props.title}</h3>
        <p className="text-xs text-v-text-muted">No data in window</p>
      </Card>
    );
  }
  return (
    <Card className="p-v-3">
      <h3 className="text-sm font-semibold mb-v-2">{props.title}</h3>
      <ul className="text-sm space-y-v-1">
        {entries.slice(0, 12).map(([k, v]) => (
          <li key={k} className="flex justify-between gap-v-2">
            <span className="text-v-text-secondary truncate">{k}</span>
            <span className="font-medium tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function AiOperationsMetricsPage() {
  const [metrics, setMetrics] = useState<AIOperationsMetricsResponse | null>(null);
  const [report, setReport] = useState<AIOperationsWorkflowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [metricsRes, reportRes] = await Promise.all([
      aiOperationsApi.getMetrics(),
      aiOperationsApi.getWorkflowReport(),
    ]);
    if (metricsRes.error) setError(metricsRes.error);
    else setMetrics(metricsRes.data ?? null);
    if (reportRes.error && !metricsRes.error) setError(reportRes.error);
    else setReport(reportRes.data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <PipelineSubpageShell
      title="Metrics dashboard"
      description="Platform intelligence metrics and Phase 6 evaluation/correction workflow reporting."
      actions={<Button variant="secondary" onClick={() => void load()}>Refresh</Button>}
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      {metrics ? (
        <>
          <p className="text-sm text-v-text-secondary mb-v-4">
            Window: {new Date(metrics.window.from).toLocaleDateString()} — {new Date(metrics.window.to).toLocaleDateString()}
            · Volume: {metrics.executionVolume}
          </p>
          <OperationsMetricGrid metrics={metrics.metrics} />
        </>
      ) : null}

      {report ? (
        <div className="mt-v-6 space-y-v-4">
          <h2 className="font-semibold">Evaluation &amp; correction workflow report</h2>
          <p className="text-sm text-v-text-secondary">
            Open evaluations: {report.openEvaluations}
            {report.averageResolutionTimeHours != null
              ? ` · Avg resolution: ${report.averageResolutionTimeHours}h`
              : ''}
            {' · '}Open work items: {report.workItemsOpen}
            {' · '}Linked regressions: {report.regressionsLinked}
          </p>
          <div className="grid gap-v-3 md:grid-cols-2 xl:grid-cols-3">
            <TrendTable title="Evaluations by status" rows={report.evaluationsByStatus} />
            <TrendTable title="Corrections by destination" rows={report.correctionsByDestination} />
            <TrendTable title="Corrections by status" rows={report.correctionsByStatus} />
            <TrendTable title="Root causes" rows={report.rootCausesByCode} />
            <TrendTable title="Label trends" rows={report.labelTrends} />
            <TrendTable title="Provider trends" rows={report.providerTrends} />
          </div>
        </div>
      ) : null}
    </PipelineSubpageShell>
  );
}
