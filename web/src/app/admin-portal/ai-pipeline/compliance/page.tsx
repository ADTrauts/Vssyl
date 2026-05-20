'use client';

import React from 'react';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import PipelineCompliancePanel from '../../../../components/admin-portal/ai-pipeline/PipelineCompliancePanel';

export default function AiPipelineCompliancePage() {
  return (
    <PipelineSubpageShell
      title="Compliance & export"
      description="Retention policy, diagnostic exports, and expired trace purge."
    >
      <PipelineCompliancePanel />
    </PipelineSubpageShell>
  );
}
