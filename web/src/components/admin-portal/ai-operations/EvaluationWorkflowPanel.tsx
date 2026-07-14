'use client';

/**
 * Phase 6 — End-to-end evaluation/correction workflow panel on execution detail.
 * Extends existing Pipeline Hub; does not create a new admin product.
 */
import { useState } from 'react';
import { Alert, Button, Card } from 'shared/components';
import { OperationsStatusBadge } from './OperationsStatusBadge';
import { aiOperationsApi } from '../../../lib/aiOperationsApi';
import type { AIExecutionDetailView } from 'shared/types';

const EVAL_LABELS = ['INCORRECT', 'UNSAFE', 'INCOMPLETE', 'WRONG_RETRIEVAL', 'WRONG_TOOL', 'OTHER'] as const;

export function EvaluationWorkflowPanel(props: {
  executionId: string;
  detail: AIExecutionDetailView;
  onRefresh: () => void;
}) {
  const { executionId, detail, onRefresh } = props;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [label, setLabel] = useState<string>('INCORRECT');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Workflow action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-v-4 space-y-v-3">
      <h2 className="font-semibold">Evaluation &amp; correction workflow</h2>
      <p className="text-xs text-v-text-muted">
        Corrections are governed proposals only — they never modify Twin runtime directly.
      </p>
      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="space-y-v-2">
        <label className="text-xs block">Create evaluation</label>
        <select
          className="border border-v-border rounded px-v-2 py-v-1 text-sm w-full"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        >
          {EVAL_LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <textarea
          className="border border-v-border rounded px-v-2 py-v-1 text-sm w-full"
          rows={2}
          placeholder="Notes (auditable)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const res = await aiOperationsApi.createEvaluation(executionId, {
                labels: [label],
                notes: notes || undefined,
                priority: 'MEDIUM',
              });
              if (res.error) throw new Error(res.error);
            })
          }
        >
          Evaluate this execution
        </Button>
      </div>

      <div className="border-t border-v-border pt-v-3 space-y-v-3">
        <h3 className="text-sm font-medium">Open evaluations ({detail.evaluations.length})</h3>
        {detail.evaluations.length === 0 ? (
          <p className="text-sm text-v-text-muted">None yet.</p>
        ) : null}
        {detail.evaluations.map((ev) => (
          <div key={ev.id} className="border border-v-border rounded p-v-2 space-y-v-2 text-sm">
            <div className="flex flex-wrap gap-v-2 items-center">
              <OperationsStatusBadge status={ev.lifecycleStatus ?? ev.workflowStatus} />
              <span>{ev.labels.join(', ')}</span>
            </div>
            <div className="flex flex-wrap gap-v-2">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await aiOperationsApi.updateEvaluation(ev.id, {
                      workflowStatus: 'UNDER_REVIEW',
                      comment: 'Moved to under review',
                    });
                    if (res.error) throw new Error(res.error);
                  })
                }
              >
                Start review
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await aiOperationsApi.addRootCauses(ev.id, {
                      codes: ['RETRIEVAL'],
                      notes: 'Operator-suggested root cause',
                    });
                    if (res.error) throw new Error(res.error);
                  })
                }
              >
                Add root cause
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await aiOperationsApi.updateEvaluation(ev.id, {
                      workflowStatus: 'CLOSED',
                      resolutionCode: 'VERIFIED',
                      comment: 'Closed after verification',
                    });
                    if (res.error) throw new Error(res.error);
                  })
                }
              >
                Close
              </Button>
            </div>
            {ev.rootCauses?.map((rc) => (
              <div key={rc.id} className="flex flex-wrap gap-v-2 items-center text-xs">
                <span>
                  {rc.code} · {rc.reviewStatus}
                </span>
                {rc.reviewStatus === 'SUGGESTED' ? (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const res = await aiOperationsApi.reviewRootCause(rc.id, {
                          reviewStatus: 'APPROVED',
                          notes: 'Confirmed',
                          confidence: 0.8,
                        });
                        if (res.error) throw new Error(res.error);
                      })
                    }
                  >
                    Confirm cause
                  </Button>
                ) : null}
              </div>
            ))}
            {ev.history?.length ? (
              <details className="text-xs">
                <summary>History ({ev.history.length})</summary>
                <ul className="mt-v-1 space-y-v-1 font-mono">
                  {ev.history.slice(-8).map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      {h.at} · {h.action}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-v-border pt-v-3 space-y-v-2">
        <h3 className="text-sm font-medium">Corrections ({detail.corrections.length})</h3>
        {detail.corrections.map((c) => (
          <div key={c.id} className="border border-v-border rounded p-v-2 text-sm space-y-v-2">
            <div className="flex flex-wrap gap-v-2 items-center">
              <OperationsStatusBadge status={c.status} />
              <OperationsStatusBadge status={c.routingApprovalStatus} />
              <span>
                {c.rootCauseCode} → {(c.overrideDestinations ?? c.destinations).join(', ')}
              </span>
            </div>
            {c.routingApprovalStatus !== 'APPROVED' ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await aiOperationsApi.updateCorrection(c.id, {
                      routingApprovalStatus: 'APPROVED',
                      createRegression: true,
                      comment: 'Approved governed proposal',
                    });
                    if (res.error) throw new Error(res.error);
                  })
                }
              >
                Approve proposal + link regression
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await aiOperationsApi.updateCorrection(c.id, {
                      status: 'VERIFIED',
                      comment: 'Marked verified',
                    });
                    if (res.error) throw new Error(res.error);
                  })
                }
              >
                Mark verified
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
