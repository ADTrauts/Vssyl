'use client';

import React from 'react';
import { Badge } from 'shared/components';
import type { PipelineReasoningDepth } from '../../../types/adminAiPipeline';

const STYLES: Record<PipelineReasoningDepth, string> = {
  LOW: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  MEDIUM: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  HIGH: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
};

export default function PipelineReasoningDepthBadge({
  depth,
  className = '',
}: {
  depth: PipelineReasoningDepth;
  className?: string;
}) {
  return (
    <Badge className={`${STYLES[depth]} ${className}`}>
      Depth: {depth}
    </Badge>
  );
}
