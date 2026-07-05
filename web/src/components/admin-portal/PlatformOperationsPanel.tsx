'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Spinner } from 'shared/components';
import { AlertTriangle, CheckCircle, HelpCircle, RefreshCw, XCircle } from 'lucide-react';
import {
  formatUptime,
  OPERATOR_STATUS_LABEL,
  operatorStatusTextClass,
  SERVICE_DISPLAY_NAMES,
  type OperatorServiceStatus,
  type PlatformOperationsStatus,
  type ServiceRow,
} from '../../lib/adminPlatformOperations';
import { usePlatformOperationsStatus } from '../../hooks/usePlatformOperationsStatus';

function StatusIcon({ status }: { status: OperatorServiceStatus }) {
  if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === 'offline') return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
  return <HelpCircle className="w-4 h-4 text-v-text-muted shrink-0" />;
}

function ServiceDetail({ row, name }: { row: { operatorStatus: OperatorServiceStatus; error?: string; details?: Record<string, unknown> }; name: string }) {
  const detailParts: string[] = [];
  if (name === 'Stripe' && row.details?.mode) {
    detailParts.push(`Mode: ${String(row.details.mode)}`);
  }
  if (name === 'Storage' && row.details?.provider) {
    detailParts.push(`Provider: ${String(row.details.provider)}`);
  }
  if (name === 'Database' && row.details?.version) {
    detailParts.push(`PostgreSQL ${String(row.details.version)}`);
  }
  if (name === 'Realtime' && row.details?.mode) {
    detailParts.push(String(row.details.mode));
  }
  if (name === 'Search' && row.details?.delegateCount !== undefined) {
    detailParts.push(`${row.details.delegateCount} delegate(s)`);
  }

  return (
    <div className="flex items-start gap-v-2 text-sm">
      <StatusIcon status={row.operatorStatus} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-v-2">
          <span className="font-medium text-v-text-primary">{name}</span>
          <span className={`text-xs font-medium ${operatorStatusTextClass(row.operatorStatus)}`}>
            {OPERATOR_STATUS_LABEL[row.operatorStatus]}
          </span>
        </div>
        {detailParts.length > 0 && (
          <p className="text-xs text-v-text-muted mt-0.5">{detailParts.join(' · ')}</p>
        )}
        {row.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate" title={row.error}>
            {row.error}
          </p>
        )}
      </div>
    </div>
  );
}

function PlatformMeta({ platform }: { platform: PlatformOperationsStatus['platform'] }) {
  const rows = [
    { label: 'Environment', value: platform.environment },
    { label: 'API uptime', value: formatUptime(platform.uptimeSeconds) },
    {
      label: 'Cloud Run',
      value: platform.cloudRunService
        ? `${platform.cloudRunService}${platform.cloudRunRevision ? ` · ${platform.cloudRunRevision.slice(0, 12)}` : ''}`
        : 'Local / not on Cloud Run',
    },
    { label: 'Node', value: platform.nodeVersion },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-v-4 gap-y-v-2 text-xs">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-v-text-muted">{row.label}</dt>
          <dd className="text-v-text-primary font-medium truncate" title={row.value}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PlatformOperationsPanel({ compact = false }: { compact?: boolean }) {
  const { data, loading, error, refresh } = usePlatformOperationsStatus({ poll: !compact });

  if (loading && !data) {
    return (
      <Card className="p-v-6 flex items-center justify-center gap-v-3">
        <Spinner />
        <span className="text-sm text-v-text-secondary">Checking platform health…</span>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-v-6 border-red-200 dark:border-red-900/40">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <Button variant="secondary" size="sm" className="mt-v-3" onClick={() => void refresh()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  const serviceEntries = Object.entries(data.services) as Array<
    [keyof PlatformOperationsStatus['services'], PlatformOperationsStatus['services'][keyof PlatformOperationsStatus['services']]]
  >;

  return (
    <Card className="p-v-6">
      <div className="flex flex-wrap items-start justify-between gap-v-4 mb-v-4">
        <div>
          <h2 className="text-lg font-semibold text-v-text-primary">Platform health</h2>
          <p className="text-sm text-v-text-secondary mt-1">
            Live status from existing probes — database, Stripe, SMTP, AI providers, storage, and search.
          </p>
        </div>
        <div className="flex items-center gap-v-2">
          <span
            className={`text-sm font-semibold ${operatorStatusTextClass(data.overallStatus)}`}
          >
            {OPERATOR_STATUS_LABEL[data.overallStatus]}
          </span>
          <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!compact && <PlatformMeta platform={data.platform} />}

      <div
        className={`grid gap-v-4 mt-v-4 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
      >
        {serviceEntries.map(([key, row]) => {
          if (key === 'api') {
            const apiRow = row as PlatformOperationsStatus['services']['api'];
            return (
              <ServiceDetail
                key={key}
                name={SERVICE_DISPLAY_NAMES.api}
                row={{
                  operatorStatus: apiRow.status,
                  details: { uptime: apiRow.uptimeSeconds },
                }}
              />
            );
          }
          return (
            <ServiceDetail
              key={key}
              name={SERVICE_DISPLAY_NAMES[key]}
              row={row as ServiceRow}
            />
          );
        })}
      </div>

      {data.recommendations.length > 0 && !compact && (
        <div className="mt-v-4 pt-v-4 border-t border-v-border">
          <p className="text-xs font-semibold text-v-text-muted uppercase tracking-wide mb-v-2">
            Operator notes
          </p>
          <ul className="text-xs text-v-text-secondary space-y-1 list-disc list-inside">
            {data.recommendations.slice(0, 4).map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && (
        <div className="mt-v-4 flex flex-wrap gap-v-3 text-sm">
          <Link href="/admin-portal/system" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            System administration →
          </Link>
          <Link href="/admin-portal/system-logs" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            System logs →
          </Link>
        </div>
      )}
    </Card>
  );
}
