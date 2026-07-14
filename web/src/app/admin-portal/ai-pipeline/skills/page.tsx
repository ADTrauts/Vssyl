'use client';

/**
 * Phase 8B — Skill Registry + durable quality (Pipeline observe-only).
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AISkillOpsOverview, AISkillRegistryListItem } from 'shared/types';

type DurableQuality = {
  skillKey: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number | null;
  observationEventCount: number;
  evaluationCount: number;
  correctionCount: number;
  regressionCount: number;
  routerShadowAgreementRate: number | null;
};

type SkillsPayload = {
  overview: AISkillOpsOverview;
  items: AISkillRegistryListItem[];
  metrics: {
    executionCount: number;
    successCount: number;
    failureCount: number;
    schemaValidationFailures: number;
    groundingFailures: number;
    averageLatencyMs: number;
    routerShadowAgreementRate: number | null;
  };
  durableQuality?: Record<string, DurableQuality>;
  fingerprints?: Record<string, string>;
  productionRoutingUnchanged: boolean;
  customerCreatedSkillsEnabled: boolean;
  industryPacksEnabled: boolean;
  canonicalProductization?: boolean;
};

export default function SkillsRegistryPage() {
  const [data, setData] = useState<SkillsPayload | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detailJson, setDetailJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const ov = await aiOperationsApi.getSkillsOverview();
    if (ov.error) setError(ov.error);
    else setData(ov.data as SkillsPayload | null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const loadDetail = async (key: string) => {
    setSelected(key);
    const d = await aiOperationsApi.getSkillDetail(key);
    if (d.error) setError(d.error);
    else setDetailJson(JSON.stringify(d.data ?? null, null, 2));
  };

  return (
    <PipelineSubpageShell
      title="Skills"
      description="Canonical Skill productization. Intent ≠ Skill ≠ Capability ≠ Provider. Durable quality from execution intelligence."
      actions={
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      {loading && (
        <div className="flex justify-center py-v-8">
          <Spinner />
        </div>
      )}
      {error && (
        <Alert type="error" className="mb-v-4">
          {error}
        </Alert>
      )}
      {data && !loading && (
        <div className="space-y-v-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-v-3">
            <Card className="p-v-3">
              <div className="text-xs text-v-text-muted">Skills</div>
              <div className="text-xl font-semibold tabular-nums">{data.overview.skillCount}</div>
            </Card>
            <Card className="p-v-3">
              <div className="text-xs text-v-text-muted">Active</div>
              <div className="text-xl font-semibold tabular-nums">{data.overview.activeCount}</div>
            </Card>
            <Card className="p-v-3">
              <div className="text-xs text-v-text-muted">Durable executions</div>
              <div className="text-xl font-semibold tabular-nums">{data.overview.recentExecutions}</div>
            </Card>
            <Card className="p-v-3">
              <div className="text-xs text-v-text-muted">Success</div>
              <div className="text-xl font-semibold tabular-nums">{data.overview.successCount}</div>
            </Card>
          </div>

          <Alert type="info">
            Canonical productization: {data.canonicalProductization ? 'on' : 'off'}. Customer-created
            Skills: {data.customerCreatedSkillsEnabled ? 'on' : 'off'}. Industry packs:{' '}
            {data.industryPacksEnabled ? 'on' : 'off'}. Production Model Router:{' '}
            {data.productionRoutingUnchanged ? 'unchanged (shadow)' : 'live'}.
          </Alert>

          <Card className="p-v-3 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-v-2">Registry + durable quality</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-v-text-muted border-b border-v-border">
                  <th className="py-v-2 pr-v-2">Key</th>
                  <th className="py-v-2 pr-v-2">Version</th>
                  <th className="py-v-2 pr-v-2">Status</th>
                  <th className="py-v-2 pr-v-2">Exec</th>
                  <th className="py-v-2 pr-v-2">Eval</th>
                  <th className="py-v-2 pr-v-2">Corr</th>
                  <th className="py-v-2 pr-v-2">Reg</th>
                  <th className="py-v-2 pr-v-2">Shadow Δ</th>
                  <th className="py-v-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => {
                  const q = data.durableQuality?.[row.key];
                  const agree =
                    q?.routerShadowAgreementRate == null
                      ? '—'
                      : `${Math.round(q.routerShadowAgreementRate * 100)}%`;
                  return (
                    <tr key={row.key} className="border-b border-v-border/60">
                      <td className="py-v-2 pr-v-2 font-medium">{row.key}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{row.activeVersion}</td>
                      <td className="py-v-2 pr-v-2">{row.status}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{q?.executionCount ?? 0}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{q?.evaluationCount ?? 0}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{q?.correctionCount ?? 0}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{q?.regressionCount ?? 0}</td>
                      <td className="py-v-2 pr-v-2 tabular-nums">{agree}</td>
                      <td className="py-v-2">
                        <Button variant="secondary" onClick={() => void loadDetail(row.key)}>
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {data.fingerprints && Object.keys(data.fingerprints).length > 0 && (
            <Card className="p-v-3">
              <h3 className="text-sm font-semibold mb-v-2">Version fingerprints</h3>
              <ul className="text-xs space-y-v-1 font-mono text-v-text-secondary">
                {Object.entries(data.fingerprints).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v.slice(0, 16)}…
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {selected && detailJson && (
            <Card className="p-v-3">
              <h3 className="text-sm font-semibold mb-v-2">
                Detail: {selected} (certification, evals, corrections, regressions)
              </h3>
              <pre className="text-xs overflow-auto max-h-96 bg-v-surface-secondary p-v-3 rounded-md">
                {detailJson}
              </pre>
            </Card>
          )}
        </div>
      )}
    </PipelineSubpageShell>
  );
}
