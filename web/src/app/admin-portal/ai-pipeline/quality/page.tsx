'use client';

import React from 'react';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import PipelineQualityDashboard from '../../../../components/admin-portal/ai-pipeline/PipelineQualityDashboard';

export default function AiPipelineQualityPage() {
  return (
    <PipelineSubpageShell
      title="Generic Response Guard"
      description="At-risk response trends and monitored weak phrases."
    >
      <PipelineQualityDashboard />
    </PipelineSubpageShell>
  );
}
