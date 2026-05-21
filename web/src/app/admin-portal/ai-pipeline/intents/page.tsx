'use client';

import React from 'react';
import { Spinner } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import PipelineIntentRegistrySection from '../../../../components/admin-portal/ai-pipeline/registry/PipelineIntentRegistrySection';

export default function AiPipelineIntentsPage() {
  return (
    <PipelineSubpageShell
      title="Intent Engine"
      description="Dynamic intent registry: create, duplicate, archive. Custom intents are policy metadata until v2 inference."
    >
      <PipelineIntentRegistrySection />
    </PipelineSubpageShell>
  );
}
