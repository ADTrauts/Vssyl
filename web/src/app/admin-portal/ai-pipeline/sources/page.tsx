'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineContextSourceEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import PipelineRegistryPageShell from '../../../../components/admin-portal/ai-pipeline/registry/PipelineRegistryPageShell';
import { usePipelineRegistry } from '../../../../components/admin-portal/ai-pipeline/registry/usePipelineRegistry';

export default function AiPipelineSourcesPage() {
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
  const sources = (catalog?.contextSources ?? []).filter((s) => matchesFilter(s));
  return (
    <PipelineSubpageShell
      title="Context sources"
      description="Registry-managed context sources with custom mappedTools[] and lifecycle."
    >
      <PipelineRegistryPageShell
        title="Context source registry"
        description="Platform, module, external, and synthetic sources."
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
          <PipelineContextSourceEditor
            sources={sources.filter((s) => !s.archived || includeArchived)}
            onSaved={() => void reload()}
          />
        )}
      </PipelineRegistryPageShell>
    </PipelineSubpageShell>
  );
}
