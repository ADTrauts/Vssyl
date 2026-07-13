'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Spinner, Alert, Button, Badge } from 'shared/components';
import PipelineSubpageShell from '../../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { ExecutionTimelinePanel } from '../../../../../components/admin-portal/ai-operations/ExecutionTimelinePanel';
import { OperationsStatusBadge } from '../../../../../components/admin-portal/ai-operations/OperationsStatusBadge';
import { aiOperationsApi } from '../../../../../lib/aiOperationsApi';
import type { AIExecutionDetailView, AIExecutionExplanation } from 'shared/types';

export default function AiOperationsExecutionDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<AIExecutionDetailView | null>(null);
  const [explain, setExplain] = useState<AIExecutionExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const [dRes, eRes] = await Promise.all([
        aiOperationsApi.getExecution(id),
        aiOperationsApi.getExplainability(id),
      ]);
      if (dRes.error) setError(dRes.error);
      else setDetail(dRes.data ?? null);
      if (eRes.data) setExplain(eRes.data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <PipelineSubpageShell
      title="Execution detail"
      description={`Record ${id}`}
      actions={
        <Link href="/admin-portal/ai-pipeline/executions">
          <Button variant="secondary">Back to list</Button>
        </Link>
      }
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      {detail ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-v-4">
          <div className="lg:col-span-2 space-y-v-4">
            <Card className="p-v-4">
              <h2 className="font-semibold mb-v-2">Summary</h2>
              <p className="text-sm"><strong>Surface:</strong> {detail.record.surface}</p>
              <p className="text-sm"><strong>Provider:</strong> {detail.record.provider ?? '—'} / {detail.record.model ?? '—'}</p>
              <p className="text-sm mt-v-2"><strong>Query:</strong> {detail.record.userQuery ?? detail.promptSummary ?? '—'}</p>
              <p className="text-sm mt-v-2"><strong>Response:</strong> {detail.record.aiResponseSummary ?? '—'}</p>
            </Card>
            <Card className="p-v-4">
              <h2 className="font-semibold mb-v-3">Timeline</h2>
              <ExecutionTimelinePanel events={detail.record.timeline} />
            </Card>
            {detail.linkedActionExecutions.length > 0 ? (
              <Card className="p-v-4">
                <h2 className="font-semibold mb-v-2">AIActionExecution</h2>
                <ul className="text-sm space-y-v-2">
                  {detail.linkedActionExecutions.map((a) => (
                    <li key={a.id} className="flex gap-v-2 items-center">
                      <span className="font-mono text-xs">{a.actionName}</span>
                      <OperationsStatusBadge status={a.status} />
                      <Badge>{a.riskCategory}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
            {explain ? (
              <Card className="p-v-4">
                <h2 className="font-semibold mb-v-2">Explainability</h2>
                <p className="text-sm text-v-text-secondary">{explain.whyThisAnswer}</p>
                <ul className="text-sm mt-v-2 list-disc pl-v-4">
                  <li>{explain.whyProviderSelected}</li>
                  {explain.whyApprovalRequired?.map((w) => <li key={w}>{w}</li>)}
                  {explain.groundingNotes?.map((g) => <li key={g}>{g}</li>)}
                </ul>
                <p className="text-xs text-v-text-muted mt-v-2">Private chain-of-thought excluded.</p>
              </Card>
            ) : null}
          </div>
          <div className="space-y-v-4">
            <Card className="p-v-4">
              <h2 className="font-semibold mb-v-2">Context & sources</h2>
              <p className="text-xs text-v-text-muted">Providers</p>
              <ul className="text-sm">{detail.contextProviders?.map((c) => <li key={c}>{c}</li>) ?? <li>—</li>}</ul>
              <p className="text-xs text-v-text-muted mt-v-2">Retrieved</p>
              <ul className="text-sm">{detail.retrievedSources?.map((s) => <li key={s}>{s}</li>) ?? <li>—</li>}</ul>
            </Card>
            <Card className="p-v-4">
              <h2 className="font-semibold mb-v-2">Evaluations ({detail.evaluations.length})</h2>
              {detail.evaluations.map((e) => (
                <div key={e.id} className="text-sm border-t border-v-border py-v-2">
                  <OperationsStatusBadge status={e.workflowStatus} />
                  <span className="ml-v-2">{e.labels.join(', ')}</span>
                </div>
              ))}
            </Card>
            <Card className="p-v-4">
              <h2 className="font-semibold mb-v-2">Corrections ({detail.corrections.length})</h2>
              {detail.corrections.map((c) => (
                <div key={c.id} className="text-sm border-t border-v-border py-v-2">
                  <OperationsStatusBadge status={c.status} />
                  <span className="ml-v-2">{c.rootCauseCode} → {c.destinations.join(', ')}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      ) : null}
    </PipelineSubpageShell>
  );
}
