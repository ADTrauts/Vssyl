'use client';

import React from 'react';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import PipelinePolicyAuditTable from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyAuditTable';

export default function AiPipelineAuditPage() {
  return (
    <PipelineSubpageShell
      title="Policy audit log"
      description="History of admin edits to pipeline intents, grounding, sources, tools, and quality phrases."
    >
      <PipelinePolicyAuditTable />
    </PipelineSubpageShell>
  );
}
