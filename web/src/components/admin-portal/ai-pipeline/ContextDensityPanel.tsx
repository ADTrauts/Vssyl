'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineContextDensityReport } from '../../../types/adminAiPipeline';

interface ContextDensityPanelProps {
  report: PipelineContextDensityReport;
}

export default function ContextDensityPanel({ report }: ContextDensityPanelProps) {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Context density</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Providers attempted" value={report.providers.attempted} />
          <Metric label="Succeeded" value={report.providers.succeeded} />
          <Metric label="Failed" value={report.providers.failed} />
          <Metric label="Cache hits" value={report.providers.cacheHits} />
          <Metric label="Memory loaded" value={report.memory.factsLoaded} />
          <Metric label="Memory injected" value={report.memory.factsInjected} />
          <Metric label="Module contexts" value={report.modules.contextsLoaded} />
          <Metric label="Blocks injected" value={report.blocks.injected} />
          <Metric label="Synthetic blocks" value={report.blocks.synthetic} />
          <Metric label="Live blocks" value={report.blocks.live} />
          <Metric
            label="Tokens used / budget"
            value={`${report.tokenBudget.totalUsedEstimate} / ${report.tokenBudget.totalAllocated}`}
          />
          <Metric label="Missing context flags" value={report.missingContextCount} />
        </div>
      </section>

      {report.providers.attempts.length > 0 && (
        <section>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Provider attempts</h4>
          <ul className="space-y-2">
            {report.providers.attempts.map((attempt) => (
              <li
                key={`${attempt.moduleId}-${attempt.providerName}-${attempt.status}`}
                className="flex flex-wrap items-center gap-2 p-2 rounded bg-gray-50 dark:bg-slate-800"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {attempt.moduleId}.{attempt.providerName}
                </span>
                <StatusBadge status={attempt.status} />
                {attempt.cacheHit && (
                  <Badge className="bg-blue-100 text-blue-800">cache hit</Badge>
                )}
                {typeof attempt.latencyMs === 'number' && (
                  <span className="text-xs text-gray-500">{attempt.latencyMs}ms</span>
                )}
                {attempt.failureReason && (
                  <span className="text-xs text-red-700 dark:text-red-300">
                    {attempt.failureReason}: {attempt.failureMessage}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.tokenBudget.byTier.length > 0 && (
        <section>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Token budget by tier</h4>
          <ul className="space-y-1 text-gray-700 dark:text-gray-300">
            {report.tokenBudget.byTier.map((tier) => (
              <li key={tier.tier}>
                {tier.tier}: {tier.tokensUsedEstimate} used / {tier.tokenBudgetAllocated} allocated (
                {tier.blocksInjected} blocks)
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-2 rounded bg-gray-50 dark:bg-slate-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'succeeded'
      ? 'bg-green-100 text-green-800'
      : status === 'failed'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-700';
  return <Badge className={cls}>{status}</Badge>;
}
