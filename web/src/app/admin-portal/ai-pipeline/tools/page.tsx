'use client';

import React from 'react';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { PipelineToolPolicyEditor } from '../../../../components/admin-portal/ai-pipeline/PipelinePolicyEditors';
import PipelineRegistryPageShell from '../../../../components/admin-portal/ai-pipeline/registry/PipelineRegistryPageShell';
import { usePipelineRegistry } from '../../../../components/admin-portal/ai-pipeline/registry/usePipelineRegistry';

export default function AiPipelineToolsPage() {
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
  const policies = (catalog?.toolPolicies ?? []).filter((t) => matchesFilter(t));
  return (
    <PipelineSubpageShell
      title="Tool Policies"
      description="Tool registry with runtimeKind: openai_tool, prepass, or policy_only."
    >
      <PipelineRegistryPageShell
        title="Tool policy registry"
        description="Policy-only tools are not executable in the twin until wired."
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
          <PipelineToolPolicyEditor
            policies={policies.filter((p) => !p.archived || includeArchived)}
            onSaved={() => void reload()}
          />
        )}
      </PipelineRegistryPageShell>
    </PipelineSubpageShell>
  );
}
