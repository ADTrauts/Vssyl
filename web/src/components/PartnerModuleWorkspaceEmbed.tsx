'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Spinner } from 'shared/components';
import ModuleHost from './ModuleHost';
import { getModuleRuntime, getWorkspaceBridgeInit, type ModuleRuntimeConfig } from '../api/modules';
import type { WorkspaceBridgeInitPayload } from 'shared/types/workspace-bridge';

interface PartnerModuleWorkspaceEmbedProps {
  moduleId: string;
  businessId: string;
  businessDashboardId: string | null;
  className?: string;
}

export default function PartnerModuleWorkspaceEmbed({
  moduleId,
  businessId,
  businessDashboardId,
  className = 'h-full',
}: PartnerModuleWorkspaceEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ModuleRuntimeConfig | null>(null);
  const [bridgeInit, setBridgeInit] = useState<WorkspaceBridgeInitPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [runtimeConfig, init] = await Promise.all([
          getModuleRuntime(moduleId, { scope: 'business', businessId }),
          getWorkspaceBridgeInit(moduleId, {
            scope: 'business',
            businessId,
            dashboardId: businessDashboardId ?? undefined,
          }),
        ]);
        if (cancelled) return;
        setRuntime(runtimeConfig);
        setBridgeInit(init);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load partner module';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [moduleId, businessId, businessDashboardId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 py-16 ${className}`}>
        <Spinner size={24} />
        <span className="text-gray-600 dark:text-gray-400">Loading module workspace…</span>
      </div>
    );
  }

  if (error || !runtime || !bridgeInit) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert type="error" title="Module unavailable">
          {error ?? 'This module is not available in the business workspace.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <ModuleHost
        entryUrl={runtime.frontend.entryUrl}
        bundleRuntime={Boolean(runtime.frontend.bundleRuntime)}
        bundleEntryPath={runtime.frontend.entryPath || 'index.html'}
        artifactSignedUrl={runtime.artifactAccess?.signedUrl}
        moduleName={runtime.name}
        settings={runtime.settings}
        workspaceBridgeInit={bridgeInit}
      />
    </div>
  );
}
