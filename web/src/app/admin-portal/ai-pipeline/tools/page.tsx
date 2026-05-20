'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineToolPolicyEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import { usePipelineCatalog } from '../../../../components/admin-portal/ai-pipeline/usePipelineCatalog';

export default function AiPipelineToolsPage() {
  const { catalog, loading, error, reload } = usePipelineCatalog();
  return (
    <PipelineSubpageShell title="Tool Policies" description="Tool consideration rules by intent.">
      {error && <Alert>{error}</Alert>}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {catalog && (
        <PipelineToolPolicyEditor policies={catalog.toolPolicies} onSaved={() => void reload()} />
      )}
    </PipelineSubpageShell>
  );
}
