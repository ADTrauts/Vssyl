'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { AIPipelineTrace, PipelineEvidenceBundle } from '../../../types/adminAiPipeline';
import PipelineEvidenceViewer from './PipelineEvidenceViewer';
import PipelineFlagReasonsPanel from './PipelineFlagReasonsPanel';
import PipelineContextUsedPanel from './PipelineContextUsedPanel';
import PipelineReasoningDepthBadge from './PipelineReasoningDepthBadge';
import PipelineFailureCategoryBadges from './PipelineFailureCategoryBadges';

interface PipelineTraceDetailProps {
  trace: AIPipelineTrace;
  evidenceBundle?: PipelineEvidenceBundle | null;
}

function RiskBadge({ risk }: { risk: boolean }) {
  return (
    <Badge className={risk ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
      {risk ? 'At risk' : 'OK'}
    </Badge>
  );
}

export default function PipelineTraceDetail({ trace, evidenceBundle }: PipelineTraceDetailProps) {
  const depth = trace.insights?.reasoningDepth ?? 'MEDIUM';
  const failureCategories = trace.insights?.failureCategories ?? [];

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <RiskBadge risk={trace.genericResponseRisk} />
        <PipelineReasoningDepthBadge depth={depth} />
        <Badge className="bg-gray-100 text-gray-800">Confidence: {trace.confidenceLevel}</Badge>
        {trace.groundingRequired && (
          <Badge className="bg-amber-100 text-amber-900">Grounding required</Badge>
        )}
        {trace.retrievalPerformed ? (
          <Badge className="bg-green-100 text-green-800">Retrieval performed</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-700">No retrieval</Badge>
        )}
        {trace.enforcementApplied && trace.enforcementAction && trace.enforcementAction !== 'none' && (
          <Badge className="bg-purple-100 text-purple-900">
            Enforcement: {trace.enforcementAction}
          </Badge>
        )}
        {trace.diagnosticSource === 'TEST_LAB' && (
          <Badge className="bg-blue-100 text-blue-800">Test lab</Badge>
        )}
      </div>

      {failureCategories.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Failure categories</h3>
          <PipelineFailureCategoryBadges categories={failureCategories} />
        </section>
      )}

      <PipelineFlagReasonsPanel trace={trace} />

      <PipelineContextUsedPanel trace={trace} />

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">User message</h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{trace.userMessage}</p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Response preview</h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{trace.finalResponsePreview}</p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Intents</h3>
        <div className="flex flex-wrap gap-1">
          {trace.intentDetected.map((id) => (
            <Badge key={id} className="bg-indigo-100 text-indigo-800">
              {id}
            </Badge>
          ))}
        </div>
      </section>

      {trace.qualityWarnings.length > 0 && (
        <section>
          <h3 className="font-semibold text-amber-800 mb-1">Quality warnings</h3>
          <ul className="list-disc pl-5 text-amber-800 dark:text-amber-200 space-y-1">
            {trace.qualityWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {trace.issues.length > 0 && (
        <section>
          <h3 className="font-semibold text-red-800 mb-1">Issues</h3>
          <ul className="list-disc pl-5 text-red-700 dark:text-red-300 space-y-1">
            {trace.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Tools considered</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {trace.toolsConsidered.length > 0 ? trace.toolsConsidered.join(', ') : '—'}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Tools used</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {trace.toolsUsed.length > 0
              ? trace.toolsUsed.map((t) => `${t.name} (r${t.round}${t.success ? '' : ', failed'})`).join(', ')
              : '—'}
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Memory</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Facts: {trace.memoryRetrieved.facts} · Recalled messages:{' '}
          {trace.memoryRetrieved.recalledMessages} · Thread memory:{' '}
          {trace.memoryRetrieved.threadMemory ? 'yes' : 'no'}
        </p>
      </section>

      {trace.legacySignals && (
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Legacy signals</h3>
          <pre className="text-xs bg-gray-50 dark:bg-slate-900 p-3 rounded overflow-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(trace.legacySignals, null, 2)}
          </pre>
        </section>
      )}

      {evidenceBundle ? (
        <PipelineEvidenceViewer bundle={evidenceBundle} trace={trace} />
      ) : (
        <PipelineContextUsedPanel trace={trace} />
      )}

      <section>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Trace metadata</h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          ID: {trace.traceId} · User: {trace.userId}
          {trace.conversationHistoryId
            ? ` · History: ${trace.conversationHistoryId}`
            : ''}{' '}
          · {new Date(trace.createdAt).toLocaleString()}
        </p>
      </section>
    </div>
  );
}
