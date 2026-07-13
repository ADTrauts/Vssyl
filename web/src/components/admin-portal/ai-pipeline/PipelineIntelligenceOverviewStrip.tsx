'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, CheckCircle, Layers } from 'lucide-react';
import { AdminStatCard } from '../AdminStatCard';
import { OperationsMetricGrid } from '../ai-operations/OperationsMetricGrid';
import { aiOperationsApi } from '../../../lib/aiOperationsApi';
import type { AIOperationsOverview } from 'shared/types';
import { Spinner } from 'shared/components';

/**
 * Phase 4B — Intelligence overview strip for the canonical AI Pipeline hub.
 * Reuses Phase 4 overview API; does not create a second product shell.
 */
export function PipelineIntelligenceOverviewStrip() {
  const [overview, setOverview] = useState<AIOperationsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void aiOperationsApi.getOverview().then((res) => {
      if (res.data) setOverview(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="py-v-2">
        <Spinner />
      </section>
    );
  }

  if (!overview) return null;

  return (
    <section className="space-y-v-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-v-text-secondary uppercase tracking-wide">
          Intelligence & workflow
        </h2>
        <Link
          href="/admin-portal/ai-pipeline/executions"
          className="text-sm text-indigo-600 hover:underline"
        >
          Open Execution Explorer
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-v-4">
        <AdminStatCard title="Executions" value={overview.executionCount} icon={Layers} color="blue" />
        <AdminStatCard
          title="Pending evaluations"
          value={overview.pendingEvaluations}
          icon={AlertTriangle}
          color="yellow"
        />
        <AdminStatCard
          title="Open corrections"
          value={overview.openCorrections}
          icon={Activity}
          color="orange"
        />
        <AdminStatCard
          title="Active regressions"
          value={overview.activeRegressions}
          icon={CheckCircle}
          color="green"
        />
      </div>
      {overview.recentMetrics.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-v-text-secondary mb-v-2">Recent platform metrics</h3>
          <OperationsMetricGrid metrics={overview.recentMetrics} />
        </div>
      ) : null}
    </section>
  );
}
