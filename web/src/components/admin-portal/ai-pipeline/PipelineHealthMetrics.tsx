'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { PipelineCatalog, PipelineQualityStats } from '../../../types/adminAiPipeline';
import { AdminPortalEmptyState } from '../AdminPortalEmptyState';
import PipelineEnforcementBadge from './PipelineEnforcementBadge';

function MetricCard({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          : 'border-gray-200 bg-white dark:border-slate-700 bg-v-surface'
      }`}
    >
      <p className="text-xs font-medium text-v-text-muted">{label}</p>
      <p className="text-xl font-semibold text-v-text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-v-text-muted dark:text-v-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-v-border p-4 animate-pulse bg-v-surface">
      <div className="h-3 w-24 bg-v-surface-muted rounded mb-2" />
      <div className="h-7 w-16 bg-v-surface-muted rounded" />
    </div>
  );
}

export default function PipelineHealthMetrics({
  stats,
  catalog,
  loading,
}: {
  stats: PipelineQualityStats | null;
  catalog: PipelineCatalog | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <AdminPortalEmptyState
        icon={<BarChart3 className="w-12 h-12" />}
        title="No quality metrics yet"
        description="Run Test Lab or twin queries after migrations are applied."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-v-text-muted dark:text-v-text-muted">
          Last {stats.timeRangeDays} days
        </span>
        <PipelineEnforcementBadge enforcement={catalog?.enforcement} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Grounded response rate"
          value={`${stats.groundedResponsePercent}%`}
          sub={`${stats.groundingRequiredCount} required grounding`}
        />
        <MetricCard
          label="Generic risk rate"
          value={`${stats.atRiskPercent}%`}
          highlight={stats.atRiskPercent > 20}
          sub={`${stats.atRiskCount} at-risk traces`}
        />
        <MetricCard
          label="Retrieval trigger rate"
          value={`${stats.retrievalTriggerPercent}%`}
          sub={`${stats.retrievalTriggerCount} with retrieval`}
        />
        <MetricCard
          label="Tool usage rate"
          value={`${stats.toolUsagePercent}%`}
          sub={`${stats.toolUsageCount} with tools`}
        />
        <MetricCard
          label="Average confidence"
          value={stats.averageConfidenceLabel}
          sub={`L${stats.confidenceDistribution.low} M${stats.confidenceDistribution.medium} H${stats.confidenceDistribution.high}`}
        />
        <MetricCard
          label="Top failed intent"
          value={stats.topFailedIntent ?? '—'}
        />
        <MetricCard
          label="Diagnostics retained"
          value={String(stats.diagnosticsRetainedTotal)}
          sub={`${stats.diagnosticsExportableInWindow} in retention window`}
        />
        <MetricCard
          label="Traces in window"
          value={String(stats.totalTraces)}
        />
      </div>
    </div>
  );
}
