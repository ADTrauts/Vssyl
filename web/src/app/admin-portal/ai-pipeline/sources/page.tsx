'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineContextSourceEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import { usePipelineCatalog } from '../../../../components/admin-portal/ai-pipeline/usePipelineCatalog';

export default function AiPipelineSourcesPage() {
  const { catalog, loading, error, reload } = usePipelineCatalog();
  return (
    <PipelineSubpageShell
      title="Context sources"
      description="Platform context sources and twin wiring flags."
    >
      {error && <Alert>{error}</Alert>}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {catalog && (
        <PipelineContextSourceEditor sources={catalog.contextSources} onSaved={() => void reload()} />
      )}
    </PipelineSubpageShell>
  );
}
