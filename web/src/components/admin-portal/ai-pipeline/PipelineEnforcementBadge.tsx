'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineEnforcementSettings } from '../../../types/adminAiPipeline';

export default function PipelineEnforcementBadge({
  enforcement,
}: {
  enforcement?: PipelineEnforcementSettings;
}) {
  if (!enforcement) {
    return (
      <Badge className="bg-v-surface-muted text-gray-700 bg-v-surface dark:text-v-text-muted">
        Enforcement: unknown
      </Badge>
    );
  }

  const mode = enforcement.enforcementEnabled
    ? enforcement.enforcementMode.toUpperCase()
    : 'OFF';

  const color =
    !enforcement.enforcementEnabled
      ? 'bg-v-surface-muted text-gray-800 bg-v-surface dark:text-gray-200'
      : enforcement.enforcementMode === 'block' || enforcement.enforcementMode === 'regenerate'
        ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
        : enforcement.enforcementMode === 'disclose'
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200';

  return (
    <Badge className={color}>
      Enforcement: {mode}
    </Badge>
  );
}
