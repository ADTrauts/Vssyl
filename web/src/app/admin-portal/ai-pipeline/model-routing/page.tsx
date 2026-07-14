'use client';

/**
 * Phase 7 — Model Routing observe-only Pipeline section.
 * Shadow comparisons; no policy editing.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIModelRoutingOpsOverview, AIModelRoutingShadowComparison } from 'shared/types';

type OverviewPayload = {
  overview: AIModelRoutingOpsOverview;
  policyVersion: string;
  catalog: Array<{
    catalogKey: string;
    provider: string;
    label: string;
    tier: string;
    capabilities: string[];
    status: string;
  }>;
  fallbackDocumentation: string;
  shadowMode: boolean;
  productionRoutingUnchanged: boolean;
};

function DistTable(props: { title: string; rows: Record<string, number> }) {
  const entries = Object.entries(props.rows).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="p-v-3">
      <h3 className="text-sm font-semibold mb-v-2">{props.title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-v-text-muted">No shadow data yet</p>
      ) : (
        <ul className="text-sm space-y-v-1">
          {entries.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-v-2">
              <span className="truncate text-v-text-secondary">{k}</span>
              <span className="tabular-nums font-medium">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ModelRoutingPage() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [shadow, setShadow] = useState<AIModelRoutingShadowComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [ov, sh] = await Promise.all([
      aiOperationsApi.getModelRoutingOverview(),
      aiOperationsApi.getModelRoutingShadow(40),
    ]);
    if (ov.error) setError(ov.error);
    else setData(ov.data ?? null);
    if (sh.error && !ov.error) setError(sh.error);
    else setShadow(sh.data?.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <PipelineSubpageShell
      title="Model Routing"
      description="Capability → tier → proposed provider (shadow). Production selection is unchanged."
      actions={
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      {loading ? <Spinner /> : null}
      {error ? <Alert type="error">{error}</Alert> : null}
      {data ? (
        <div className="space-y-v-4">
          <Alert type="info">
            Shadow mode {data.shadowMode ? 'ON' : 'OFF'} · Production routing unchanged:{' '}
            {data.productionRoutingUnchanged ? 'yes' : 'no'} · Policy {data.policyVersion}
            {data.overview.providerMatchRate != null
              ? ` · Provider match ${(data.overview.providerMatchRate * 100).toFixed(1)}%`
              : ''}
          </Alert>

          <div className="grid gap-v-3 md:grid-cols-2 xl:grid-cols-4">
            <DistTable title="Proposed providers" rows={data.overview.proposedProviderDistribution} />
            <DistTable title="Current providers" rows={data.overview.currentProviderDistribution} />
            <DistTable title="Capabilities" rows={data.overview.capabilityDistribution} />
            <DistTable title="Tiers" rows={data.overview.tierDistribution} />
          </div>

          <Card className="p-v-4">
            <h2 className="font-semibold mb-v-2">Canonical catalog (observe)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-v-text-secondary border-b border-v-border">
                    <th className="py-v-2 pr-v-2">Catalog key</th>
                    <th className="py-v-2 pr-v-2">Provider</th>
                    <th className="py-v-2 pr-v-2">Tier</th>
                    <th className="py-v-2">Capabilities</th>
                  </tr>
                </thead>
                <tbody>
                  {data.catalog.map((m) => (
                    <tr key={m.catalogKey} className="border-b border-v-border/60">
                      <td className="py-v-2 pr-v-2 font-medium">{m.catalogKey}</td>
                      <td className="py-v-2 pr-v-2">{m.provider}</td>
                      <td className="py-v-2 pr-v-2">{m.tier}</td>
                      <td className="py-v-2 text-v-text-secondary">{m.capabilities.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-v-4">
            <h2 className="font-semibold mb-v-2">Recent shadow comparisons</h2>
            {shadow.length === 0 ? (
              <p className="text-sm text-v-text-muted">
                No comparisons yet. Twin and specialized paths record shadows on next requests.
              </p>
            ) : (
              <ul className="space-y-v-2 text-sm">
                {shadow.map((c, i) => (
                  <li
                    key={`${c.recordedAt}-${i}`}
                    className="border border-v-border rounded p-v-2 flex flex-col gap-v-1"
                  >
                    <div className="flex flex-wrap gap-v-2 justify-between">
                      <span className="font-medium">{c.requestedCapability}</span>
                      <span className={c.match ? 'text-green-700' : 'text-amber-700'}>
                        {c.match ? 'match' : 'diff'} · {c.selectedTier}
                      </span>
                    </div>
                    <div className="text-v-text-secondary">
                      current {c.currentProvider}
                      {c.currentModel ? `/${c.currentModel}` : ''} → proposed{' '}
                      {c.proposedProvider} ({c.proposedCatalogKey})
                    </div>
                    <div className="text-xs text-v-text-muted truncate">{c.routingReason}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-v-4">
            <h2 className="font-semibold mb-v-2">Fallback documentation</h2>
            <pre className="text-xs whitespace-pre-wrap text-v-text-secondary">
              {data.fallbackDocumentation}
            </pre>
          </Card>
        </div>
      ) : null}
    </PipelineSubpageShell>
  );
}
