'use client';

import React from 'react';
import { Badge } from 'shared/components';
import { Activity } from 'lucide-react';
import type { AIPipelineTrace } from '../../../types/adminAiPipeline';
import { AdminPortalEmptyState } from '../AdminPortalEmptyState';
import PipelineReasoningDepthBadge from './PipelineReasoningDepthBadge';

interface PipelineTraceTableProps {
  traces: AIPipelineTrace[];
  selectedId?: string;
  onSelect: (trace: AIPipelineTrace) => void;
}

export default function PipelineTraceTable({ traces, selectedId, onSelect }: PipelineTraceTableProps) {
  if (traces.length === 0) {
    return (
      <AdminPortalEmptyState
        icon={<Activity className="w-12 h-12" />}
        title="No diagnostics traces yet"
        description="Run the test lab or send a twin query."
      />
    );
  }

  return (
    <div className="overflow-x-auto border border-v-border rounded-lg">
      <table className="min-w-full divide-y divide-v-border text-sm">
        <thead className="bg-v-surface-muted">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Time</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Intent</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Depth</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Ground</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Retrieval</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Conf</th>
            <th className="px-3 py-3 text-left font-medium text-v-text-secondary">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-v-border bg-v-surface">
          {traces.map((trace) => {
            const depth = trace.insights?.reasoningDepth ?? 'MEDIUM';
            return (
              <tr
                key={trace.traceId}
                onClick={() => onSelect(trace)}
                className={`cursor-pointer hover:bg-v-surface-muted ${
                  selectedId === trace.traceId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <td className="px-3 py-3 whitespace-nowrap text-v-text-muted text-xs">
                  {new Date(trace.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                    {trace.intentDetected[0] ?? '—'}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <PipelineReasoningDepthBadge depth={depth} className="text-xs" />
                </td>
                <td className="px-3 py-3 text-xs text-v-text-secondary">
                  {trace.groundingRequired ? 'req' : '—'}
                </td>
                <td className="px-3 py-3 text-xs">
                  {trace.retrievalPerformed ? (
                    <span className="text-green-700 dark:text-green-400">yes</span>
                  ) : (
                    <span className="text-v-text-muted">no</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-v-text-secondary">
                  {trace.confidenceLevel}
                </td>
                <td className="px-3 py-3">
                  <Badge
                    className={
                      trace.genericResponseRisk
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {trace.genericResponseRisk ? 'Risk' : 'OK'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
