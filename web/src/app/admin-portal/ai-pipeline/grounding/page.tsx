'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineGroundingEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import { usePipelineCatalog } from '../../../../components/admin-portal/ai-pipeline/usePipelineCatalog';

export default function AiPipelineGroundingPage() {
  const { catalog, loading, error, reload } = usePipelineCatalog();
  return (
    <PipelineSubpageShell
      title="Grounding rules"
      description="Required and optional context sources per intent."
    >
      {error && <Alert>{error}</Alert>}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {catalog && (
        <PipelineGroundingEditor rules={catalog.groundingRules} onSaved={() => void reload()} />
      )}
    </PipelineSubpageShell>
  );
}
