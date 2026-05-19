'use client';

import React, { useState } from 'react';
import { Button, Card } from 'shared/components';
import { Sparkles, X } from 'lucide-react';
import { reviewPendingLearning, type PendingLearningFromTwin } from '../../api/aiContextLearning';

interface LearnedFromChatBannerProps {
  token: string;
  pending: PendingLearningFromTwin;
  onDismissed: () => void;
  onPromoted?: () => void;
}

export default function LearnedFromChatBanner({
  token,
  pending,
  onDismissed,
  onPromoted,
}: LearnedFromChatBannerProps) {
  const [busy, setBusy] = useState(false);
  const latest = pending.latest;

  if (!latest || pending.count < 1) {
    return null;
  }

  const handleReview = async (action: 'promote' | 'dismiss') => {
    setBusy(true);
    try {
      await reviewPendingLearning(token, latest.id, action);
      if (action === 'promote') {
        onPromoted?.();
      }
      onDismissed();
    } catch (err) {
      console.error('Failed to review pending learning:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40">
      <div className="flex gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            I may have learned something from this chat
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            <span className="font-medium">{latest.title}:</span> {latest.content}
          </p>
          {pending.count > 1 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              +{pending.count - 1} more waiting in AI Control Center
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => void handleReview('promote')}
            >
              Save to memories
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void handleReview('dismiss')}
            >
              Not now
            </Button>
          </div>
          </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close"
          disabled={busy}
          onClick={() => void handleReview('dismiss')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
