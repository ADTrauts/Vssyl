'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, RefreshCw } from 'lucide-react';
import { Alert, Button } from 'shared/components';
import PipelineEnforcementBadge from './PipelineEnforcementBadge';
import PipelineHealthMetrics from './PipelineHealthMetrics';
import PipelineLiveActivityFeed from './PipelineLiveActivityFeed';
import PipelineAtRiskTrends from './PipelineAtRiskTrends';
import PipelineHubToolSections from './PipelineHubToolSections';
import { usePipelineHubData } from './usePipelineHubData';

export default function PipelineOperationsHub() {
  const { data, loading, error, refresh } = usePipelineHubData(60_000);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Pipeline</h1>
            <p className="text-gray-700 dark:text-gray-300 mt-1 max-w-2xl">
              Operations console for grounding, retrieval, tools, and response quality across the
              Digital Life Twin.
            </p>
            <div className="mt-2">
              <PipelineEnforcementBadge enforcement={data.catalog?.enforcement} />
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} className="shrink-0">
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Refresh
        </Button>
      </header>

      {error && (
        <Alert>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <Button variant="secondary" onClick={() => void refresh()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Pipeline health
        </h2>
        <PipelineHealthMetrics stats={data.stats} catalog={data.catalog} loading={loading} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineLiveActivityFeed traces={data.traces} loading={loading} />
        </div>
        <div>
          <PipelineAtRiskTrends stats={data.stats} loading={loading} />
        </div>
      </section>

      <PipelineHubToolSections />

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Related:{' '}
        <Link href="/admin-portal/ai-context" className="text-indigo-600 hover:underline">
          Context Debug
        </Link>{' '}
        ·{' '}
        <Link href="/admin-portal/ai-system" className="text-indigo-600 hover:underline">
          AI System
        </Link>
      </p>
    </div>
  );
}
