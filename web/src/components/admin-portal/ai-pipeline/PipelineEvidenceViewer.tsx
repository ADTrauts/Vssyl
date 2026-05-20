'use client';

import React, { useState } from 'react';
import { Badge } from 'shared/components';
import type { AIPipelineTrace, PipelineEvidenceBundle } from '../../../types/adminAiPipeline';
import PipelineContextUsedPanel from './PipelineContextUsedPanel';

type EvidenceTab = 'assembled' | 'structured' | 'tools' | 'retrieval';

interface PipelineEvidenceViewerProps {
  bundle: PipelineEvidenceBundle;
  trace?: AIPipelineTrace;
}

function EvidenceList({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; sourceType?: string; detail?: string; confidence?: string }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={`${item.label}-${idx}`}
          className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-gray-50 dark:bg-slate-900/50"
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {item.sourceType ? `Type: ${item.sourceType}` : 'Type: —'}
            {item.confidence ? ` · Confidence: ${item.confidence}` : ''}
          </p>
          {item.detail && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PipelineEvidenceViewer({ bundle, trace }: PipelineEvidenceViewerProps) {
  const [tab, setTab] = useState<EvidenceTab>('assembled');

  const tabs: { id: EvidenceTab; label: string; count: number }[] = [
    { id: 'assembled', label: 'Assembled context', count: bundle.assembledEvidence.length },
    { id: 'structured', label: 'Structured response', count: bundle.structuredEvidence.length },
    { id: 'tools', label: 'Tool outputs', count: bundle.toolOutputs.length },
    { id: 'retrieval', label: 'Retrieval', count: bundle.retrievalRecords.length },
  ];

  return (
    <section className="space-y-3">
      {trace && <PipelineContextUsedPanel trace={trace} />}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Evidence & confidence</h3>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.id
                ? 'bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-100'
                : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'assembled' && (
        <div className="space-y-3">
          {bundle.assembledUsedModules.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bundle.assembledUsedModules.map((mod) => (
                <Badge key={mod} className="bg-blue-100 text-blue-800">
                  {mod}
                </Badge>
              ))}
            </div>
          )}
          {bundle.assembledContextBlocks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Context blocks</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                {bundle.assembledContextBlocks.map((b) => (
                  <li key={b.title}>
                    {b.title}
                    {b.sourceType ? ` (${b.sourceType})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <EvidenceList items={bundle.assembledEvidence} emptyLabel="No assembled evidence items." />
        </div>
      )}

      {tab === 'structured' && (
        <div className="space-y-3">
          {bundle.structuredConfidence && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Model confidence: <strong>{bundle.structuredConfidence.level ?? '—'}</strong>
              {bundle.structuredConfidence.explanation
                ? ` — ${bundle.structuredConfidence.explanation}`
                : ''}
            </p>
          )}
          <EvidenceList
            items={bundle.structuredEvidence}
            emptyLabel="No structured evidence in the model JSON response."
          />
        </div>
      )}

      {tab === 'tools' && (
        <div>
          {bundle.toolOutputs.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No tools were invoked.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="py-1 pr-4">Tool</th>
                  <th className="py-1 pr-4">Round</th>
                  <th className="py-1">Success</th>
                </tr>
              </thead>
              <tbody>
                {bundle.toolOutputs.map((t, i) => (
                  <tr key={`${t.name}-${i}`} className="border-t border-gray-100 dark:border-slate-700">
                    <td className="py-2 font-mono text-indigo-700 dark:text-indigo-300">{t.name}</td>
                    <td className="py-2">{t.round}</td>
                    <td className="py-2">{t.success ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'retrieval' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Sources used: {bundle.sourcesUsed.length > 0 ? bundle.sourcesUsed.join(', ') : '—'}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Memory — facts: {bundle.memoryRetrieved.facts}, recalled:{' '}
            {bundle.memoryRetrieved.recalledMessages}, thread:{' '}
            {bundle.memoryRetrieved.threadMemory ? 'yes' : 'no'}
          </p>
          {bundle.retrievalRecords.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No retrieval records.</p>
          ) : (
            <ul className="space-y-2">
              {bundle.retrievalRecords.map((r, i) => (
                <li
                  key={`${r.source}-${i}`}
                  className="text-sm border border-gray-200 dark:border-slate-600 rounded p-2"
                >
                  <span className="font-mono text-indigo-700 dark:text-indigo-300">{r.source}</span>
                  {r.provider ? ` · ${r.provider}` : ''} · items: {r.itemCount}
                </li>
              ))}
            </ul>
          )}
          {bundle.qualityWarnings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Quality warnings</p>
              <ul className="list-disc pl-5 text-sm text-amber-900 dark:text-amber-200">
                {bundle.qualityWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
