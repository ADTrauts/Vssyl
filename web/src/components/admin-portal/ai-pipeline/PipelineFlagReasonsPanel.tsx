'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AIPipelineTrace } from '../../../types/adminAiPipeline';

export default function PipelineFlagReasonsPanel({ trace }: { trace: AIPipelineTrace }) {
  const reasons = trace.insights?.flagReasons ?? [];

  if (reasons.length === 0 && !trace.genericResponseRisk) {
    return (
      <section className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
        <h3 className="font-semibold text-v-text-primary mb-1">Why flagged</h3>
        <p className="text-sm text-v-text-secondary">No risk flags for this trace.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        <h3 className="font-semibold text-v-text-primary">Why flagged</h3>
      </div>
      {reasons.length === 0 ? (
        <p className="text-sm text-v-text-secondary">
          Marked at risk but no detailed reasons were derived.
        </p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-200">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
