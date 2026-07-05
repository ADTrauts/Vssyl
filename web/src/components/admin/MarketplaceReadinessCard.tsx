'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Spinner } from 'shared/components';
import { RefreshCw } from 'lucide-react';
import { adminApiService, type MarketplaceReadinessShape } from '../../lib/adminApiService';
import { showProbeToast } from '../../lib/adminPortalOperatorToast';

function scopeBadgeColor(scope: string | null): 'blue' | 'green' | 'gray' | 'yellow' | 'red' {
  switch (scope) {
    case 'personal':
      return 'green';
    case 'business':
      return 'blue';
    case 'both':
      return 'yellow';
    case 'internal':
      return 'gray';
    default:
      return 'gray';
  }
}

function statusLabel(ok: boolean, declared: boolean): string {
  if (!declared) return 'Not declared';
  return ok ? 'Ready' : 'Gap';
}

export function MarketplaceReadinessCard({
  moduleId,
  compact = false,
}: {
  moduleId: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<MarketplaceReadinessShape | null>(null);
  const [probeLoading, setProbeLoading] = useState<string | null>(null);
  const [probeNote, setProbeNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getMarketplaceReadiness(moduleId);
    if (res.error) {
      setError(res.error);
      setReadiness(null);
    } else {
      setReadiness(res.data?.readiness ?? null);
    }
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runProbe = async (kind: 'search' | 'workspace' | 'billing' | 'activity') => {
    setProbeLoading(kind);
    setProbeNote(null);
    try {
      let res;
      if (kind === 'search') {
        res = await adminApiService.runSearchDelegateProbe(moduleId);
      } else if (kind === 'workspace') {
        res = await adminApiService.runWorkspaceBridgeProbe(moduleId);
      } else if (kind === 'activity') {
        res = await adminApiService.runActivityIngestProbe(moduleId);
      } else {
        res = await adminApiService.runBusinessBillingProbe(moduleId);
      }
      if (res.error) {
        setProbeNote(`${kind} probe failed: ${res.error}`);
        showProbeToast(`${kind} delegate`, false, res.error);
      } else {
        const payload = res.data as Record<string, unknown> | undefined;
        const summary =
          typeof payload?.message === 'string'
            ? payload.message
            : typeof payload?.outcome === 'string'
              ? payload.outcome
              : 'OK';
        setProbeNote(`${kind} probe succeeded: ${summary}`);
        showProbeToast(`${kind} delegate`, true, summary);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Probe failed';
      setProbeNote(msg);
      showProbeToast(kind, false, msg);
    } finally {
      setProbeLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 flex items-center gap-2 text-sm text-gray-600">
        <Spinner size={16} />
        Loading marketplace readiness…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
        {error}
        <Button variant="secondary" size="sm" className="ml-2" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!readiness) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-3">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Marketplace readiness
        </span>
        <Badge color={scopeBadgeColor(readiness.moduleScope)} size="sm">
          Scope: {readiness.moduleScope ?? 'unknown'}
        </Badge>
        <Badge
          color={readiness.certification.passed ? 'green' : 'red'}
          size="sm"
        >
          Certification: {readiness.certification.status}
        </Badge>
        {!compact && (
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {readiness.supportedContexts.length > 0 && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Contexts: {readiness.supportedContexts.join(', ')}
        </p>
      )}

      <div className={`grid gap-2 text-xs ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Search delegate</span>
          <p className="text-gray-600 dark:text-gray-400">
            {statusLabel(
              readiness.searchDelegate.registered && readiness.searchDelegate.allowlisted,
              readiness.searchDelegate.declared
            )}
            {readiness.searchDelegate.declared && (
              <>
                {' '}
                · registered={readiness.searchDelegate.registered ? 'yes' : 'no'}
                · allowlist={readiness.searchDelegate.allowlisted ? 'yes' : 'no'}
              </>
            )}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Workspace bridge</span>
          <p className="text-gray-600 dark:text-gray-400">
            {statusLabel(
              readiness.workspaceBridge.registered && readiness.workspaceBridge.allowlisted,
              readiness.workspaceBridge.declared
            )}
            {readiness.workspaceBridge.declared && (
              <>
                {' '}
                · registered={readiness.workspaceBridge.registered ? 'yes' : 'no'}
              </>
            )}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Business billing</span>
          <p className="text-gray-600 dark:text-gray-400">
            {readiness.businessBilling.applicable
              ? `Paid module · scope ${readiness.businessBilling.scopeCompatible ? 'ok' : 'mismatch'}`
              : 'Free / tier-gated'}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Activity ingest</span>
          <p className="text-gray-600 dark:text-gray-400">
            {readiness.activityIngest.declared
              ? `registered=${readiness.activityIngest.registered ? 'yes' : 'no'} · cert=${
                  readiness.activityIngest.certificationActive ? 'ok' : 'gap'
                }`
              : 'Not declared'}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={probeLoading !== null}
            onClick={() => void runProbe('search')}
          >
            {probeLoading === 'search' ? 'Probing…' : 'Search probe'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={probeLoading !== null}
            onClick={() => void runProbe('workspace')}
          >
            {probeLoading === 'workspace' ? 'Probing…' : 'Workspace probe'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={probeLoading !== null}
            onClick={() => void runProbe('billing')}
          >
            {probeLoading === 'billing' ? 'Probing…' : 'Billing probe'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={probeLoading !== null}
            onClick={() => void runProbe('activity')}
          >
            {probeLoading === 'activity' ? 'Probing…' : 'Activity probe'}
          </Button>
        </div>
      )}

      {probeNote && (
        <p
          className={`mt-2 text-xs ${
            probeNote.includes('failed') || probeNote.includes('Probe failed')
              ? 'text-red-700 dark:text-red-300'
              : 'text-green-700 dark:text-green-300'
          }`}
        >
          {probeNote}
        </p>
      )}
    </div>
  );
}
