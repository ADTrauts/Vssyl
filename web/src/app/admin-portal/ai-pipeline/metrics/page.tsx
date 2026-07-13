'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { OperationsMetricGrid } from '../../../../components/admin-portal/ai-operations/OperationsMetricGrid';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIOperationsMetricsResponse } from 'shared/types';

export default function AiOperationsMetricsPage() {
  const [metrics, setMetrics] = useState<AIOperationsMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await aiOperationsApi.getMetrics();
    if (res.error) setError(res.error);
    else setMetrics(res.data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <PipelineSubpageShell
      title="Metrics dashboard"
      description="Modular platform intelligence metrics — knowledge remains scoped."
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
    </PipelineSubpageShell>
  );
}
