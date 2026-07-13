'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Alert } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import { adminApiService } from '../../../../lib/adminApiService';

/**
 * Canonical System Health — consolidates pipeline quality posture + intelligence ops health.
 * Phase 4B: replaces separate AI Operations Center system-health page.
 */
export default function AiPipelineSystemHealthPage() {
  const [opsHealth, setOpsHealth] = useState<{
    status: string;
    observeOnly: boolean;
    replayExecutionEnabled?: boolean;
  } | null>(null);
  const [qualityNote, setQualityNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [h, q] = await Promise.all([
        aiOperationsApi.getHealth(),
        adminApiService.getAiPipelineQualityStats(),
      ]);
      if (h.error) setError(h.error);
      else setOpsHealth(h.data ?? null);
      if (q.data) {
        setQualityNote(
          `Quality stats loaded (${typeof q.data === 'object' ? 'pipeline telemetry available' : 'ok'}). See Quality & Diagnostics for details.`
        );
      }
      setLoading(false);
    })();
  }, []);

  return (
    <PipelineSubpageShell
      title="System Health"
      description="Unified operator health: intelligence workflows, pipeline enforcement, and observe-only posture."
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      <div className="grid md:grid-cols-2 gap-v-4">
        <Card className="p-v-4">
          <h3 className="font-semibold">Intelligence workflows</h3>
          {opsHealth ? (
            <>
              <p className="text-sm mt-v-2">
                <strong>Status:</strong> {opsHealth.status}
              </p>
              <p className="text-sm mt-v-1">
                <strong>Observe only:</strong> {opsHealth.observeOnly ? 'Yes' : 'No'}
              </p>
              <p className="text-sm mt-v-1">
                <strong>Replay execution:</strong>{' '}
                {opsHealth.replayExecutionEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </>
          ) : (
            <p className="text-sm text-v-text-muted mt-v-2">Unavailable</p>
          )}
        </Card>
        <Card className="p-v-4">
          <h3 className="font-semibold">Pipeline & providers</h3>
          <p className="text-sm mt-v-2 text-v-text-secondary">
            {qualityNote ?? 'Load Quality & Enforcement and Provider Governance from the hub.'}
          </p>
          <ul className="text-sm mt-v-3 list-disc pl-v-4 space-y-v-1">
            <li>
              <Link href="/admin-portal/ai-pipeline/quality" className="text-indigo-600 hover:underline">
                Quality & Enforcement
              </Link>
            </li>
            <li>
              <Link href="/admin-portal/ai-pipeline/diagnostics" className="text-indigo-600 hover:underline">
                Response Diagnostics
              </Link>
            </li>
            <li>
              <Link
                href="/admin-portal/ai-pipeline#provider-governance"
                className="text-indigo-600 hover:underline"
              >
                Provider Governance
              </Link>
            </li>
          </ul>
        </Card>
      </div>
      <p className="text-xs text-v-text-muted mt-v-4">
        Twin runtime, provider routing, and AIActionExecution paths are unchanged. Knowledge stays
        scoped. Corrections remain proposals.
      </p>
    </PipelineSubpageShell>
  );
}
