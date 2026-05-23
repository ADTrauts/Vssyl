'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button, Badge, Spinner } from 'shared/components';
import {
  type AISuggestionItem,
  resolveSuggestionExplainability,
} from '../../api/aiSuggestions';

export interface AmbientSuggestionCardProps {
  suggestion: AISuggestionItem;
  compact?: boolean;
  defaultExpanded?: boolean;
  busy?: boolean;
  showStatus?: boolean;
  onAccept: (suggestion: AISuggestionItem) => void;
  onDismiss: (
    suggestion: AISuggestionItem,
    options?: { doNotShowAgain?: boolean; reason?: string }
  ) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DISMISSED: 'Dismissed',
  EXPIRED: 'Expired',
};

const STATUS_COLORS: Record<string, 'blue' | 'green' | 'gray' | 'yellow'> = {
  PENDING: 'blue',
  ACCEPTED: 'green',
  DISMISSED: 'gray',
  EXPIRED: 'yellow',
};

function moduleLabel(moduleId: string): string {
  const labels: Record<string, string> = {
    drive: 'Drive',
    calendar: 'Calendar',
    chat: 'Chat',
    todo: 'To-Do',
    ai: 'AI',
  };
  return labels[moduleId] ?? moduleId;
}

export default function AmbientSuggestionCard({
  suggestion,
  compact = false,
  defaultExpanded = false,
  busy = false,
  showStatus = false,
  onAccept,
  onDismiss,
}: AmbientSuggestionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const explain = resolveSuggestionExplainability(suggestion);
  const isPending = suggestion.status === 'PENDING';

  const handleDismiss = () => {
    onDismiss(suggestion, {
      doNotShowAgain,
      ...(dismissReason.trim() ? { reason: dismissReason.trim() } : {}),
    });
    setDismissOpen(false);
    setDoNotShowAgain(false);
    setDismissReason('');
  };

  return (
    <div
      className={`rounded-lg border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 shadow-sm ${
        compact ? 'p-2' : 'p-4'
      }`}
    >
      <div className="flex items-start gap-2">
        <Sparkles
          className={`text-purple-600 flex-shrink-0 ${compact ? 'h-3.5 w-3.5 mt-0.5' : 'h-4 w-4 mt-1'}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`font-medium text-gray-900 dark:text-gray-100 ${
                compact ? 'text-xs line-clamp-1' : 'text-sm'
              }`}
            >
              {suggestion.title}
            </p>
            {showStatus && (
              <Badge size="sm" color={STATUS_COLORS[suggestion.status] ?? 'gray'}>
                {STATUS_LABELS[suggestion.status] ?? suggestion.status}
              </Badge>
            )}
            {typeof suggestion.confidence === 'number' && !compact && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round(suggestion.confidence * 100)}% confidence
              </span>
            )}
          </div>
          {suggestion.body && (
            <p
              className={`text-gray-600 dark:text-gray-400 mt-0.5 ${
                compact ? 'text-xs line-clamp-2' : 'text-sm'
              }`}
            >
              {suggestion.body}
            </p>
          )}
        </div>
      </div>

      {explain && (
        <div className={`${compact ? 'mt-1.5' : 'mt-3'}`}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Why am I seeing this?
          </button>
          {expanded && (
            <div
              className={`mt-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-2 ${
                compact ? 'p-2 text-xs' : 'p-3 text-sm'
              }`}
            >
              <p className="text-gray-800 dark:text-gray-200">{explain.summary}</p>
              {explain.contextUsed.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Context used
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {explain.contextUsed.map((ctx) => (
                      <span
                        key={`${ctx.moduleId}-${ctx.reason}`}
                        className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                        title={ctx.reason}
                      >
                        {moduleLabel(ctx.moduleId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {explain.correlationReason && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Rule: </span>
                  {explain.correlationReason}
                </p>
              )}
              {explain.sourceEventIds.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on {explain.sourceEventIds.length} recent workspace event
                  {explain.sourceEventIds.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!explain && (
        <p className={`text-gray-500 dark:text-gray-400 italic ${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'}`}>
          No explainability details available for this suggestion.
        </p>
      )}

      {isPending && (
        <div className={`space-y-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              className={compact ? 'flex-1 text-xs h-7 px-2' : 'flex-1'}
              disabled={busy}
              onClick={() => onAccept(suggestion)}
            >
              {busy ? <Spinner size={12} /> : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={compact ? 'text-xs h-7 px-2' : ''}
              disabled={busy}
              onClick={() => setDismissOpen((v) => !v)}
            >
              Dismiss
            </Button>
          </div>
          {dismissOpen && (
            <div
              className={`rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 space-y-2 ${
                compact ? 'p-2' : 'p-3'
              }`}
            >
              <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={doNotShowAgain}
                  onChange={(e) => setDoNotShowAgain(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <span>
                  Don&apos;t suggest this again for 90 days
                  <span className="block text-gray-600 dark:text-gray-400 font-normal mt-0.5">
                    Applies to similar suggestions in this workspace.
                  </span>
                </span>
              </label>
              {!compact && (
                <input
                  type="text"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Optional reason (helps me learn)"
                  className="w-full text-xs rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-gray-900 dark:text-gray-100"
                />
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className={compact ? 'text-xs h-7' : ''}
                  disabled={busy}
                  onClick={() => setDismissOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className={compact ? 'text-xs h-7' : ''}
                  disabled={busy}
                  onClick={handleDismiss}
                >
                  {busy ? <Spinner size={12} /> : 'Confirm dismiss'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
