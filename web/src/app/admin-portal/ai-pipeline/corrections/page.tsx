'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { OperationsStatusBadge } from '../../../../components/admin-portal/ai-operations/OperationsStatusBadge';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIOperationsCorrectionView } from 'shared/types';

export default function AiOperationsCorrectionsPage() {
  const [items, setItems] = useState<AIOperationsCorrectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await aiOperationsApi.listCorrections({ pageSize: '50' });
    if (res.error) setError(res.error);
    else setItems(res.data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    await aiOperationsApi.updateCorrection(id, {
      routingApprovalStatus: 'APPROVED',
      status: 'IN_PROGRESS',
    });
    void load();
  };

  return (
    <PipelineSubpageShell
      title="Correction routing"
      description="Review destinations and approve routing proposals — no direct runtime mutation."
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      <div className="space-y-v-3">
        {items.map((c) => (
          <div key={c.id} className="border border-v-border rounded-lg p-v-4 flex flex-wrap justify-between gap-v-3">
            <div>
              <div className="flex gap-v-2 items-center">
                <OperationsStatusBadge status={c.status} />
                <OperationsStatusBadge status={c.routingApprovalStatus} />
              </div>
              <p className="text-sm mt-v-2"><strong>{c.rootCauseCode}</strong> → {(c.overrideDestinations ?? c.destinations).join(', ')}</p>
              <p className="text-xs text-v-text-muted">{c.rationale}</p>
            </div>
            {c.routingApprovalStatus === 'PENDING_REVIEW' ? (
              <Button size="sm" onClick={() => void approve(c.id)}>Approve routing</Button>
            ) : null}
          </div>
        ))}
      </div>
    </PipelineSubpageShell>
  );
}
