'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineCatalog } from '../../../types/adminAiPipeline';

interface PipelineCatalogSectionsProps {
  catalog: PipelineCatalog;
  section: 'intents' | 'grounding' | 'sources' | 'tools' | 'quality' | 'all';
}

export default function PipelineCatalogSections({ catalog, section }: PipelineCatalogSectionsProps) {
  const show = (s: PipelineCatalogSectionsProps['section']) => section === 'all' || section === s;

  return (
    <div className="space-y-8">
      {show('intents') && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Intent catalog</h2>
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Intent</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Grounding</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                {catalog.intents.map((intent) => (
                  <tr key={intent.id}>
                    <td className="px-4 py-2 font-mono text-indigo-700 dark:text-indigo-300">{intent.id}</td>
                    <td className="px-4 py-2">
                      {intent.groundingRequired ? (
                        <Badge className="bg-amber-100 text-amber-900">Required</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Optional</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{intent.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {show('grounding') && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Grounding rules</h2>
          <ul className="space-y-3">
            {catalog.groundingRules.map((rule) => (
              <li
                key={rule.intentId}
                className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900"
              >
                <p className="font-mono text-indigo-700 dark:text-indigo-300">{rule.intentId}</p>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{rule.requirementSummary}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Required: {rule.requiredSources.join(', ') || '—'} · Optional:{' '}
                  {rule.optionalSources.join(', ') || '—'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show('sources') && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Context sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {catalog.contextSources.map((src) => (
              <div
                key={src.id}
                className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{src.label}</span>
                  <div className="flex gap-1">
                    {src.enabled ? (
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600">Disabled</Badge>
                    )}
                    {src.wiredInTwin ? (
                      <Badge className="bg-blue-100 text-blue-800">Wired</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600">Not wired</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{src.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {show('tools') && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Tool policies</h2>
          <div className="space-y-3">
            {catalog.toolPolicies.map((policy) => (
              <div
                key={policy.toolId}
                className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-indigo-700 dark:text-indigo-300">{policy.toolId}</span>
                  {policy.enabled ? (
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Disabled</Badge>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{policy.purpose}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Required intents: {policy.requiredIntents.join(', ') || '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {show('quality') && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Generic response phrases
          </h2>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            {catalog.weakGenericPhrases.map((phrase) => (
              <li key={phrase}>&ldquo;{phrase}&rdquo;</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
