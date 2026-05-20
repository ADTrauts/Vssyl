'use client';

import React from 'react';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import AITestLabPanel from '../../../../components/admin-portal/ai-pipeline/AITestLabPanel';

export default function AiPipelineTestLabPage() {
  return (
    <PipelineSubpageShell
      title="AI Test Lab"
      description="Replay prompts through the twin pipeline in dry-run mode."
    >
      <AITestLabPanel />
    </PipelineSubpageShell>
  );
}
