'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner, Alert, Button } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import PipelineTraceTable from '../../../../components/admin-portal/ai-pipeline/PipelineTraceTable';
import PipelineTraceDetail from '../../../../components/admin-portal/ai-pipeline/PipelineTraceDetail';
import { adminApiService } from '../../../../lib/adminApiService';
import type { AIPipelineTrace } from '../../../../types/adminAiPipeline';

export default function AiPipelineDiagnosticsPage() {
  const searchParams = useSearchParams();
  const traceIdParam = searchParams?.get('traceId') ?? null;
  const userIdParam = searchParams?.get('userId') ?? '';

  const [traces, setTraces] = useState<AIPipelineTrace[]>([]);
  const [selected, setSelected] = useState<AIPipelineTrace | null>(null);
  const [evidenceBundle, setEvidenceBundle] = useState<
    import('../../../../types/adminAiPipeline').PipelineEvidenceBundle | null
  >(null);
  const [userIdFilter, setUserIdFilter] = useState(userIdParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(async (trace: AIPipelineTrace) => {
    setSelected(trace);
    setEvidenceBundle(trace.evidenceBundle ?? null);
    if (trace.evidenceBundle) return;
    const res = await adminApiService.getAiPipelineEvidence(trace.traceId);
    if (res.data?.evidenceBundle) {
      setEvidenceBundle(res.data.evidenceBundle);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getAiPipelineDiagnostics({
      limit: 50,
      ...(userIdFilter.trim() ? { userId: userIdFilter.trim() } : {}),
    });
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load diagnostics');
      setTraces([]);
      setSelected(null);
      setEvidenceBundle(null);
    } else {
      setTraces(res.data.traces);
      let pick: AIPipelineTrace | undefined;
      if (traceIdParam) {
        pick = res.data.traces.find((t) => t.traceId === traceIdParam);
        if (!pick) {
          const detailRes = await adminApiService.getAiPipelineDiagnostic(traceIdParam);
          if (detailRes.data) {
            pick = detailRes.data;
            if (!res.data.traces.some((t) => t.traceId === pick!.traceId)) {
              setTraces((prev) => [pick!, ...prev]);
            }
          }
        }
      }
      const toSelect = pick ?? res.data.traces[0];
      if (toSelect) {
        await handleSelect(toSelect);
      } else {
        setSelected(null);
        setEvidenceBundle(null);
      }
    }
    setLoading(false);
  }, [userIdFilter, handleSelect, traceIdParam]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PipelineSubpageShell
      title="Response Diagnostics"
      description="Pipeline traces from test lab runs and conversation history."
    >
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <div>
          <label className="block text-xs font-medium text-v-text-secondary mb-1">
            Filter by user ID
          </label>
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="rounded-lg border border-v-border px-3 py-2 text-sm bg-v-surface text-v-text-primary"
            placeholder="Optional"
          />
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineTraceTable
            traces={traces}
            selectedId={selected?.traceId}
            onSelect={(t) => void handleSelect(t)}
          />
          <div className="bg-v-surface border border-v-border rounded-lg p-4 min-h-[200px]">
            {selected ? (
              <PipelineTraceDetail trace={selected} evidenceBundle={evidenceBundle} />
            ) : (
              <p className="text-v-text-secondary text-sm">Select a trace to view details.</p>
            )}
          </div>
        </div>
      )}
    </PipelineSubpageShell>
  );
}
