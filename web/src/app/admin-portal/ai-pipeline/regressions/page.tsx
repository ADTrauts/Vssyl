'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { OperationsStatusBadge } from '../../../../components/admin-portal/ai-operations/OperationsStatusBadge';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIOperationsRegressionView } from 'shared/types';

export default function AiOperationsRegressionsPage() {
  const [items, setItems] = useState<AIOperationsRegressionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await aiOperationsApi.listRegressions({ pageSize: '50' });
    if (res.error) setError(res.error);
    else setItems(res.data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PipelineSubpageShell
      title="Regression library"
      description="Canonical regression cases — CI integration deferred."
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      <div className="overflow-x-auto border border-v-border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-v-surface-secondary">
            <tr>
              <th className="px-v-3 py-v-2 text-left">Title</th>
              <th className="px-v-3 py-v-2 text-left">Status</th>
              <th className="px-v-3 py-v-2 text-left">Priority</th>
              <th className="px-v-3 py-v-2 text-left">Execution</th>
              <th className="px-v-3 py-v-2 text-left">Tags</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-v-border">
                <td className="px-v-3 py-v-2">{r.title}</td>
                <td className="px-v-3 py-v-2"><OperationsStatusBadge status={r.status} /></td>
                <td className="px-v-3 py-v-2">{r.priority ?? '—'}</td>
                <td className="px-v-3 py-v-2">
                  <Link href={`/admin-portal/ai-pipeline/executions/${r.executionRecordId}`} className="text-v-accent text-xs font-mono">
                    {r.executionRecordId.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-v-3 py-v-2">{r.tags.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PipelineSubpageShell>
  );
}
