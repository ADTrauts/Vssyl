'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from 'shared/components';
import { Server, ExternalLink, RefreshCw } from 'lucide-react';
import { adminApiService } from '../../lib/adminApiService';

interface InfraIntelligence {
  overallStatus: string;
  platform: {
    environment: string;
    buildRevision: string | null;
    cloudRunService: string | null;
    uptimeSeconds: number;
  };
  modes: { stripe: string; smtp: string; stripeConfigured: boolean };
  consoleLinks: {
    cloudRun: string | null;
    cloudSql: string | null;
    storage: string | null;
    gcpProject: string | null;
  };
  services: Record<string, { operatorStatus?: string; status?: string; configured?: boolean }>;
  recommendations: string[];
}

export function InfrastructureIntelligencePanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<InfraIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getInfrastructureIntelligence();
      if (!res.error && res.data) setData(res.data as InfraIntelligence);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading && !data) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />;
  }

  if (!data) return null;

  const serviceRows = [
    { key: 'database', label: 'Database' },
    { key: 'storage', label: 'Storage' },
    { key: 'realtime', label: 'Realtime' },
    { key: 'search', label: 'Search' },
    { key: 'stripe', label: 'Stripe' },
    { key: 'email', label: 'SMTP' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-v-text-muted" />
          <h2 className="text-lg font-semibold">Infrastructure Intelligence</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <p className="text-v-text-muted text-xs uppercase">Stripe mode</p>
          <p className="font-medium capitalize">{data.modes.stripe}</p>
        </div>
        <div>
          <p className="text-v-text-muted text-xs uppercase">SMTP</p>
          <p className="font-medium capitalize">{data.modes.smtp}</p>
        </div>
        <div>
          <p className="text-v-text-muted text-xs uppercase">Revision</p>
          <p className="font-medium truncate">{data.platform.buildRevision ?? 'local'}</p>
        </div>
        <div>
          <p className="text-v-text-muted text-xs uppercase">Environment</p>
          <p className="font-medium">{data.platform.environment}</p>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.consoleLinks.cloudRun && (
            <a href={data.consoleLinks.cloudRun} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                Cloud Run <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>
          )}
          {data.consoleLinks.cloudSql && (
            <a href={data.consoleLinks.cloudSql} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                Cloud SQL <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>
          )}
          {data.consoleLinks.storage && (
            <a href={data.consoleLinks.storage} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                Storage <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {serviceRows.map(({ key, label }) => {
          const svc = data.services[key];
          const status = svc?.operatorStatus ?? svc?.status ?? 'unknown';
          return (
            <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-v-surface-muted text-sm">
              <span>{label}</span>
              <Badge className={status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                {status}
              </Badge>
            </div>
          );
        })}
      </div>

      {data.recommendations.length > 0 && !compact && (
        <ul className="mt-4 text-sm text-v-text-secondary space-y-1">
          {data.recommendations.slice(0, 3).map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
