'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { AIPipelineTrace } from '../../../types/adminAiPipeline';
import PipelineReasoningDepthBadge from './PipelineReasoningDepthBadge';

interface PipelineTraceTableProps {
  traces: AIPipelineTrace[];
  selectedId?: string;
  onSelect: (trace: AIPipelineTrace) => void;
}

export default function PipelineTraceTable({ traces, selectedId, onSelect }: PipelineTraceTableProps) {
  if (traces.length === 0) {
    return (
      <p className="text-gray-700 dark:text-gray-300 py-8 text-center">
        No diagnostics traces yet. Run the test lab or send a twin query.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
        <thead className="bg-gray-50 dark:bg-slate-900">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Intent</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Depth</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Ground</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Retrieval</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Conf</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-600 bg-white dark:bg-slate-800">
          {traces.map((trace) => {
            const depth = trace.insights?.reasoningDepth ?? 'MEDIUM';
            return (
              <tr
                key={trace.traceId}
                onClick={() => onSelect(trace)}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  selectedId === trace.traceId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs">
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
                <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300">
                  {trace.groundingRequired ? 'req' : '—'}
                </td>
                <td className="px-3 py-3 text-xs">
                  {trace.retrievalPerformed ? (
                    <span className="text-green-700 dark:text-green-400">yes</span>
                  ) : (
                    <span className="text-gray-500">no</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300">
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
