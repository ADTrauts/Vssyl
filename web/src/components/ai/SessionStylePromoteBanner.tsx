'use client';

import React, { useState } from 'react';
import { Button, Card } from 'shared/components';
import { Settings2 } from 'lucide-react';
import {
  promoteSessionPreferences,
  type SessionPreferenceAdjustments,
} from '../../api/aiSessionPreferences';

interface SessionStylePromoteBannerProps {
  token: string;
  adjustments: SessionPreferenceAdjustments;
  onDismissed: () => void;
  onSaved?: () => void;
}

export default function SessionStylePromoteBanner({
  token,
  adjustments,
  onDismissed,
  onSaved,
}: SessionStylePromoteBannerProps) {
  const [busy, setBusy] = useState(false);

  const label =
    adjustments.summary ||
    [adjustments.tone, adjustments.verbosity].filter(Boolean).join(', ') ||
    'this style';

  const handleSave = async () => {
    setBusy(true);
    try {
      const { summary: _summary, ...payload } = adjustments;
      await promoteSessionPreferences(token, payload);
      onSaved?.();
      onDismissed();
    } catch (err) {
      console.error('Failed to promote session style:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 min-w-0">
          <Settings2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Using <span className="font-medium">{label}</span> for this chat only.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleSave()}>
            Save as default
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={onDismissed}>
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}
