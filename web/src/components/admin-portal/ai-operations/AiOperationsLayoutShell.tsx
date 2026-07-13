/**
 * @deprecated Phase 4B — use PipelineSubpageShell.
 */
'use client';

import React from 'react';
import PipelineSubpageShell from '../ai-pipeline/PipelineSubpageShell';

export function AiOperationsLayoutShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PipelineSubpageShell title={title} description={description ?? ''} actions={actions}>
      {children}
    </PipelineSubpageShell>
  );
}
