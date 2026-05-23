'use client';

import React from 'react';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import AITestLabPanel from '../../../../components/admin-portal/ai-pipeline/AITestLabPanel';
import SuggestionCorrelationDryRunPanel from '../../../../components/admin-portal/ai-pipeline/SuggestionCorrelationDryRunPanel';
import ContextProviderHealthPanel from '../../../../components/admin-portal/ai-pipeline/ContextProviderHealthPanel';

export default function AiPipelineTestLabPage() {
  return (
    <PipelineSubpageShell
      title="AI Test Lab"
      description="Replay prompts through the twin pipeline and ambient suggestion fixtures in dry-run mode."
    >
      <div className="space-y-10">
        <SuggestionCorrelationDryRunPanel />
        <AITestLabPanel />
        <ContextProviderHealthPanel />
      </div>
    </PipelineSubpageShell>
  );
}
