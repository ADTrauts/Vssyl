'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineGroundingEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import PipelineRegistryPageShell from '../../../../components/admin-portal/ai-pipeline/registry/PipelineRegistryPageShell';
import { usePipelineRegistry } from '../../../../components/admin-portal/ai-pipeline/registry/usePipelineRegistry';

export default function AiPipelineGroundingPage() {
  const {
    catalog,
    loading,
    error,
    reload,
    includeArchived,
    setIncludeArchived,
    filter,
    setFilter,
    search,
    setSearch,
    matchesFilter,
  } = usePipelineRegistry();
  const rules = (catalog?.groundingRules ?? []).filter((r) =>
    matchesFilter({ ...r, id: r.intentId, enabled: r.enabled !== false })
  );
  return (
    <PipelineSubpageShell
      title="Grounding rules"
      description="One grounding rule per intent (v1). Archive-only lifecycle."
    >
      <PipelineRegistryPageShell
        title="Grounding rule registry"
        description="Required/optional sources and tools per intent."
        catalog={catalog}
        includeArchived={includeArchived}
        onIncludeArchivedChange={setIncludeArchived}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      >
        {error && <Alert>{error}</Alert>}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {catalog && (
          <PipelineGroundingEditor
            rules={rules.filter((r) => !r.archived || includeArchived)}
            onSaved={() => void reload()}
          />
        )}
      </PipelineRegistryPageShell>
    </PipelineSubpageShell>
  );
}
