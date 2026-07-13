'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { ExecutionExplorerTable } from '../../../../components/admin-portal/ai-operations/ExecutionExplorerTable';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIExecutionListItem } from 'shared/types';

export default function AiOperationsExecutionsPage() {
  const [items, setItems] = useState<AIExecutionListItem[]>([]);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await aiOperationsApi.listExecutions({
      search: search || undefined,
      provider: provider || undefined,
      pageSize: 50,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
    if (res.error) setError(res.error);
    else setItems(res.data?.items ?? []);
    setLoading(false);
  }, [search, provider]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PipelineSubpageShell
      title="Execution Explorer"
      description="Search and inspect canonical AIExecutionRecord hubs."
      actions={<Button onClick={() => void load()}>Search</Button>}
    >
      <div className="flex flex-wrap gap-v-3 mb-v-4">
        <Input placeholder="Search query or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Input placeholder="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} className="max-w-[140px]" />
      </div>
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      {!loading && !error ? <ExecutionExplorerTable items={items} /> : null}
    </PipelineSubpageShell>
  );
}
