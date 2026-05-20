'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from 'shared/components';
import type { AIPipelineTrace } from '../../../types/adminAiPipeline';
import PipelineReasoningDepthBadge from './PipelineReasoningDepthBadge';

function activityTone(trace: AIPipelineTrace): string {
  if (trace.diagnosticSource === 'TEST_LAB') {
    return 'border-l-4 border-l-blue-500';
  }
  if (
    trace.enforcementApplied &&
    trace.enforcementAction &&
    ['blocked', 'disclosed'].includes(trace.enforcementAction)
  ) {
    return 'border-l-4 border-l-red-500';
  }
  if (trace.genericResponseRisk) {
    return 'border-l-4 border-l-orange-500';
  }
  if (trace.groundingRequired && !trace.retrievalPerformed) {
    return 'border-l-4 border-l-yellow-500';
  }
  if (trace.retrievalPerformed && !trace.genericResponseRisk) {
    return 'border-l-4 border-l-green-500';
  }
  return 'border-l-4 border-l-gray-300 dark:border-l-slate-600';
}

export default function PipelineLiveActivityFeed({
  traces,
  loading,
}: {
  traces: AIPipelineTrace[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 min-h-[280px] animate-pulse">
        <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-900 min-h-[280px]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Live pipeline activity
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          No traces yet. Use Test Lab or send twin queries to populate diagnostics.
        </p>
        <Link
          href="/admin-portal/ai-pipeline/test-lab"
          className="text-sm text-indigo-600 hover:underline"
        >
          Open Test Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 min-h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Live pipeline activity
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">Refreshes every 60s</span>
      </div>
      <ul className="space-y-2 max-h-[420px] overflow-y-auto">
        {traces.map((trace) => {
          const primaryIntent = trace.intentDetected[0] ?? 'general_chat';
          const depth = trace.insights?.reasoningDepth ?? 'MEDIUM';
          return (
            <li
              key={trace.traceId}
              className={`rounded-lg border border-gray-200 dark:border-slate-700 pl-3 pr-3 py-2 ${activityTone(trace)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(trace.createdAt).toLocaleString()}
                </time>
                <div className="flex flex-wrap gap-1">
                  {trace.diagnosticSource === 'TEST_LAB' && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Test lab</Badge>
                  )}
                  <PipelineReasoningDepthBadge depth={depth} className="text-xs" />
                </div>
              </div>
              <p className="text-sm font-mono text-indigo-700 dark:text-indigo-300 mt-1">
                {primaryIntent}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                {trace.userMessage}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span>
                  Grounding: {trace.groundingRequired ? 'required' : 'no'}
                </span>
                <span>
                  Retrieval: {trace.retrievalPerformed ? 'yes' : 'no'}
                </span>
                <span>Confidence: {trace.confidenceLevel}</span>
                <span>
                  Tools: {trace.toolsUsed.length > 0 ? trace.toolsUsed.map((t) => t.name).join(', ') : 'none'}
                </span>
              </div>
              <Link
                href={`/admin-portal/ai-pipeline/diagnostics?traceId=${encodeURIComponent(trace.traceId)}`}
                className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
              >
                View diagnostic
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
