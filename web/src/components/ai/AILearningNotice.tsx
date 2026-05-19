'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card } from 'shared/components';
import { Sparkles, Settings2, X } from 'lucide-react';
import { reviewPendingLearning, type PendingLearningFromTwin } from '../../api/aiContextLearning';
import {
  promoteSessionPreferences,
  type SessionPreferenceAdjustments,
} from '../../api/aiSessionPreferences';

interface AILearningNoticeProps {
  token: string;
  /** Session style takes priority when both are present. */
  sessionAdjustments?: SessionPreferenceAdjustments | null;
  pending?: PendingLearningFromTwin | null;
  onDismissed: () => void;
  onSaved?: () => void;
}

export default function AILearningNotice({
  token,
  sessionAdjustments,
  pending,
  onDismissed,
  onSaved,
}: AILearningNoticeProps) {
  const [busy, setBusy] = useState(false);

  const showSession =
    sessionAdjustments &&
    (sessionAdjustments.summary ||
      sessionAdjustments.tone ||
      sessionAdjustments.verbosity);

  const latest = pending?.latest;
  const showPending = pending && latest && pending.count >= 1;

  if (!showSession && !showPending) {
    return null;
  }

  const sessionLabel =
    sessionAdjustments?.summary ||
    [sessionAdjustments?.tone, sessionAdjustments?.verbosity].filter(Boolean).join(', ') ||
    'this style';

  const handlePromotePending = async () => {
    if (!latest) return;
    setBusy(true);
    try {
      await reviewPendingLearning(token, latest.id, 'promote');
      onSaved?.();
      onDismissed();
    } catch (err) {
      console.error('Failed to save learning:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDismissPending = async () => {
    if (!latest) {
      onDismissed();
      return;
    }
    setBusy(true);
    try {
      await reviewPendingLearning(token, latest.id, 'dismiss');
      onDismissed();
    } catch (err) {
      console.error('Failed to dismiss learning:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSession = async () => {
    if (!sessionAdjustments) return;
    setBusy(true);
    try {
      const { summary: _summary, ...payload } = sessionAdjustments;
      await promoteSessionPreferences(token, payload);
      onSaved?.();
      onDismissed();
    } catch (err) {
      console.error('Failed to promote session style:', err);
    } finally {
      setBusy(false);
    }
  };

  if (showSession) {
    return (
      <Card className="p-4 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
        <div className="flex gap-3">
          <Settings2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              I’m using {sessionLabel} in this chat only
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Save to AI Identity if you want me to keep this style — otherwise it stays just for
              this conversation.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleSaveSession()}>
                Save to AI Identity
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={onDismissed}>
                Not now
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close" disabled={busy} onClick={onDismissed}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40">
      <div className="flex gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            I noticed something from our chat worth saving
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            <span className="font-medium">{latest!.title}:</span> {latest!.content}
          </p>
          {pending!.count > 1 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <Link href="/ai?tab=learning" className="text-purple-600 dark:text-purple-400 hover:underline">
                +{pending!.count - 1} more in Learning
              </Link>
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="primary" size="sm" disabled={busy} onClick={() => void handlePromotePending()}>
              Save to AI Identity
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleDismissPending()}>
              Not now
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" aria-label="Close" disabled={busy} onClick={() => void handleDismissPending()}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
