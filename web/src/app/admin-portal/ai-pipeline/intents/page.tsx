'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineIntentEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import { usePipelineCatalog } from '../../../../components/admin-portal/ai-pipeline/usePipelineCatalog';

export default function AiPipelineIntentsPage() {
  const { catalog, loading, error, reload } = usePipelineCatalog();
  return (
    <PipelineSubpageShell
      title="Intent Engine"
      description="Edit intent definitions and grounding requirements. Changes apply to new pipeline traces."
    >
      {error && <Alert>{error}</Alert>}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {catalog && <PipelineIntentEditor intents={catalog.intents} onSaved={() => void reload()} />}
    </PipelineSubpageShell>
  );
}
