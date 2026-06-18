'use client';

import React from 'react';
import { Button } from 'shared/components';
import type { PipelineCatalog } from '../../../../types/adminAiPipeline';
import type { RegistryFilter } from './usePipelineRegistry';

interface Props {
  title: string;
  description: string;
  catalog: PipelineCatalog | null;
  includeArchived: boolean;
  onIncludeArchivedChange: (v: boolean) => void;
  filter: RegistryFilter;
  onFilterChange: (f: RegistryFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  onCreate?: () => void;
  createLabel?: string;
  children: React.ReactNode;
}

export default function PipelineRegistryPageShell({
  title,
  description,
  catalog,
  includeArchived,
  onIncludeArchivedChange,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onCreate,
  createLabel = 'Create',
  children,
}: Props) {
  const summary = catalog?.validationSummary;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-v-text-primary">{title}</h2>
        <p className="text-sm text-v-text-muted mt-1">{description}</p>
        {summary && (
          <p className="text-xs text-v-text-muted dark:text-v-text-muted mt-2">
            Custom intents: {summary.customIntentCount} · Policy-only tools:{' '}
            {summary.policyOnlyToolCount} · Orphans: {summary.orphanCount} · Archived:{' '}
            {summary.archivedCount}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search by id…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-v-border px-3 py-1.5 text-sm bg-v-surface"
        />
        {(['all', 'enabled', 'system', 'custom', 'archived'] as RegistryFilter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => onFilterChange(f)}
          >
            {f}
          </Button>
        ))}
        <label className="flex items-center gap-2 text-sm text-v-text-muted ml-2">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => onIncludeArchivedChange(e.target.checked)}
          />
          Show archived
        </label>
        {onCreate && (
          <Button size="sm" className="ml-auto" onClick={onCreate}>
            {createLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
