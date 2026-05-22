'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from 'shared/components';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import type { ResponseInfluenceSummary, ResponseInfluenceMemoryItem } from '../../api/aiResponseInfluence';

interface AIResponseExplainDrawerProps {
  open: boolean;
  influence: ResponseInfluenceSummary | null;
  onClose: () => void;
}

function memoryTabHref(factId?: string): string {
  if (factId) return `/ai?tab=memory#fact-${encodeURIComponent(factId)}`;
  return '/ai?tab=memory';
}

export default function AIResponseExplainDrawer({
  open,
  influence,
  onClose,
}: AIResponseExplainDrawerProps) {
  if (!open || !influence) return null;

  const memoryItems: ResponseInfluenceMemoryItem[] =
    influence.memoryItems ??
    influence.memoriesUsed?.map((m) => ({
      kind: 'memory_fact' as const,
      id: m.title,
      subject: m.title,
      sourceLabel: m.sourceLabel,
      isExplicit: m.isExplicit,
    })) ??
    [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explain-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-6 shadow-xl z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h2
                id="explain-drawer-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Why I answered this way
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Here’s what shaped this reply — in plain language, without the technical details.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{influence.summary}</p>

        {influence.shapedBy.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              What shaped my answer
            </h3>
            <ul className="space-y-2">
              {influence.shapedBy.map((line) => (
                <li
                  key={line}
                  className="text-sm text-gray-800 dark:text-gray-200 pl-3 border-l-2 border-purple-300 dark:border-purple-700"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {influence.sessionOnly && influence.sessionOnly.length > 0 && (
          <section className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Only for this chat
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {influence.sessionOnly.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        {memoryItems.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Memories that shaped this reply
            </h3>
            <ul className="space-y-2">
              {memoryItems.map((m) => (
                <li
                  key={m.id}
                  className="text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{m.subject}</span>
                    {m.isExplicit === false && (
                      <Badge size="sm" color="gray">
                        Inferred
                      </Badge>
                    )}
                    {typeof m.confidence === 'number' && (
                      <Badge size="sm" color="blue">
                        {Math.round(m.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  {m.sourceLabel && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.sourceLabel}</p>
                  )}
                  <Link
                    href={memoryTabHref(m.id)}
                    className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1"
                  >
                    View in Memory
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {influence.learningItems && influence.learningItems.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Saved learnings that shaped this reply
            </h3>
            <ul className="space-y-2">
              {influence.learningItems.map((item) => (
                <li
                  key={item.id}
                  className="text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                    {typeof item.confidence === 'number' && (
                      <Badge size="sm" color="blue">
                        {Math.round(item.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/ai?tab=learning"
              className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
            >
              Review Learning
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </section>
        )}

        {influence.contextUsed && influence.contextUsed.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Workspace context
            </h3>
            <ul className="space-y-2">
              {influence.contextUsed.map((item) => (
                <li
                  key={item.moduleName}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800"
                >
                  <span>{item.moduleName}</span>
                  <Badge size="sm" color={item.usedInPrompt ? 'green' : 'gray'}>
                    {item.usedInPrompt ? 'Used' : 'Available'}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {influence.workspacePolicies && influence.workspacePolicies.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Workspace policies
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {influence.workspacePolicies.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/ai?tab=memory"
          className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2 mr-4"
        >
          Manage memories
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
        <Link
          href="/ai"
          className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2"
        >
          Shape my AI Identity
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </Card>
    </div>
  );
}
