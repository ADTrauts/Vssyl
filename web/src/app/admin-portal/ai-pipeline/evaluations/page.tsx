'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Spinner, Alert, Badge } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { OperationsStatusBadge } from '../../../../components/admin-portal/ai-operations/OperationsStatusBadge';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIOperationsEvaluationView } from 'shared/types';

const STATUSES = [
  'NEW',
  'TRIAGED',
  'UNDER_REVIEW',
  'ROOT_CAUSE_CONFIRMED',
  'CORRECTION_CREATED',
  'CORRECTION_APPROVED',
  'IMPLEMENTED',
  'VERIFIED',
  'CLOSED',
  'PENDING',
  'ASSIGNED',
  'REJECTED',
  'DUPLICATE',
  'DEFERRED',
] as const;

export default function AiOperationsEvaluationsPage() {
  const [items, setItems] = useState<AIOperationsEvaluationView[]>([]);
  const [filter, setFilter] = useState<string>('PENDING');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await aiOperationsApi.listEvaluations({
      workflowStatus: filter || undefined,
      pageSize: '50',
    });
    if (res.error) setError(res.error);
    else setItems(res.data?.items ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const bulkAssign = async () => {
    if (selected.size === 0) return;
    await aiOperationsApi.bulkUpdateEvaluations(Array.from(selected), {
      workflowStatus: 'ASSIGNED',
    });
    setSelected(new Set());
    void load();
  };

  return (
    <PipelineSubpageShell
      title="Evaluation Queue"
      description="Operator workflow — evaluations never mutate runtime directly."
      actions={
        <Button onClick={() => void bulkAssign()} disabled={selected.size === 0}>
          Bulk assign ({selected.size})
        </Button>
      }
    >
      <div className="flex flex-wrap gap-v-2 mb-v-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-v-3 py-v-1 rounded text-sm ${filter === s ? 'bg-v-accent text-white' : 'bg-v-surface-secondary'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      <div className="overflow-x-auto border border-v-border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-v-surface-secondary">
            <tr>
              <th className="px-v-2 py-v-2" />
              <th className="px-v-3 py-v-2 text-left">Status</th>
              <th className="px-v-3 py-v-2 text-left">Labels</th>
              <th className="px-v-3 py-v-2 text-left">Priority</th>
              <th className="px-v-3 py-v-2 text-left">Execution</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-v-border">
                <td className="px-v-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(row.id);
                      else next.delete(row.id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td className="px-v-3 py-v-2"><OperationsStatusBadge status={row.workflowStatus} /></td>
                <td className="px-v-3 py-v-2">{row.labels.map((l) => <Badge key={l} className="mr-1">{l}</Badge>)}</td>
                <td className="px-v-3 py-v-2">{row.priority ?? '—'}</td>
                <td className="px-v-3 py-v-2 font-mono text-xs">{row.executionRecordId.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PipelineSubpageShell>
  );
}
