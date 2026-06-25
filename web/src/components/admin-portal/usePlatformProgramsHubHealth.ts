'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  adminApiService,
  type DashboardStats,
  type MarketplaceReadinessShape,
} from '../../lib/adminApiService';
import type { PipelineCatalog, PipelineQualityStats } from '../../types/adminAiPipeline';
import {
  PLATFORM_PROGRAM_DEFINITIONS,
  UNIFIED_SEARCH_PILOT_MODULE_ID,
  type PlatformProgramDefinition,
  type PlatformProgramId,
} from '../../config/platformPrograms';
import type { PlatformProgramHealthStatus } from './PlatformProgramCard';
import { formatDashboardSystemHealth } from '../../lib/adminPortalDashboard';

export interface PlatformProgramHealthSnapshot {
  programId: PlatformProgramId;
  healthStatus: PlatformProgramHealthStatus;
  healthSummary?: string;
  readinessSummary?: string;
}

interface ModuleStatsPayload {
  pendingReviews?: number;
  totalSubmissions?: number;
}

async function loadProgramHealth(
  program: PlatformProgramDefinition,
  context: {
    dashboard: DashboardStats | null;
    pipeline: PipelineQualityStats | null;
    catalog: PipelineCatalog | null;
    moduleStats: ModuleStatsPayload | null;
    searchReadiness: MarketplaceReadinessShape | null;
  },
): Promise<Omit<PlatformProgramHealthSnapshot, 'programId'>> {
  switch (program.healthSource) {
    case 'dashboard': {
      if (!context.dashboard) {
        return { healthStatus: 'unknown', healthSummary: 'Infrastructure signal unavailable' };
      }
      const label = formatDashboardSystemHealth(
        context.dashboard.systemHealth,
        context.dashboard.systemHealthStatus,
      );
      const status: PlatformProgramHealthStatus =
        context.dashboard.systemHealthStatus === 'unavailable'
          ? 'unknown'
          : (context.dashboard.systemHealth ?? 0) >= 80
            ? 'healthy'
            : 'degraded';
      return {
        healthStatus: status,
        healthSummary: `Infrastructure pressure: ${label} (host CPU/memory — not kernel SLO)`,
        readinessSummary: `${context.dashboard.totalUsers ?? 0} users · ${context.dashboard.totalBusinesses ?? 0} businesses`,
      };
    }
    case 'pipeline': {
      if (!context.pipeline) {
        return { healthStatus: 'unknown', healthSummary: 'Pipeline quality signals unavailable' };
      }
      const atRisk = context.pipeline.atRiskPercent ?? 0;
      return {
        healthStatus: atRisk <= 15 ? 'healthy' : 'degraded',
        healthSummary: `Pipeline quality (7d): retrieval trigger ${context.pipeline.retrievalTriggerPercent}% · ${context.pipeline.totalTraces} traces`,
        readinessSummary:
          atRisk > 0 ? `${context.pipeline.atRiskCount} at-risk traces` : 'No at-risk traces in window',
      };
    }
    case 'catalog': {
      if (!context.catalog) {
        return { healthStatus: 'unknown', healthSummary: 'Catalog unavailable' };
      }
      const sourceCount = context.catalog.contextSources?.length ?? 0;
      return {
        healthStatus: sourceCount > 0 ? 'healthy' : 'degraded',
        healthSummary: `Registered sources: ${sourceCount} (catalog count — not graph engine health)`,
        readinessSummary: `${context.catalog.intents?.length ?? 0} intents · ${context.catalog.toolPolicies?.length ?? 0} tools`,
      };
    }
    case 'moduleStats': {
      if (!context.moduleStats) {
        return { healthStatus: 'unknown', healthSummary: 'Review queue unavailable' };
      }
      const pending = context.moduleStats.pendingReviews ?? 0;
      return {
        healthStatus: pending <= 5 ? 'healthy' : 'degraded',
        healthSummary: `Review queue: ${pending} pending submission${pending === 1 ? '' : 's'} (not partner runtime health)`,
        readinessSummary: `${context.moduleStats.totalSubmissions ?? 0} total submissions`,
      };
    }
    case 'searchPilotReadiness': {
      if (!context.searchReadiness) {
        return {
          healthStatus: 'unknown',
          healthSummary: 'Pilot readiness unavailable — probe per module',
          readinessSummary: `Pilot module: ${UNIFIED_SEARCH_PILOT_MODULE_ID}`,
        };
      }
      const sd = context.searchReadiness.searchDelegate;
      const ready = sd.declared && sd.registered && sd.allowlisted;
      return {
        healthStatus: ready ? 'healthy' : sd.declared ? 'degraded' : 'unknown',
        healthSummary: ready
          ? 'Search delegate registered (pilot)'
          : sd.declared
            ? 'Search delegate gap on pilot module'
            : 'Search delegate not declared on pilot',
        readinessSummary: `Scope: ${context.searchReadiness.moduleScope ?? 'unknown'}`,
      };
    }
    default:
      return { healthStatus: 'unknown' };
  }
}

export function usePlatformProgramsHubHealth() {
  const [healthByProgram, setHealthByProgram] = useState<
    Partial<Record<PlatformProgramId, PlatformProgramHealthSnapshot>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);

    const [dashboardRes, pipelineRes, catalogRes, moduleStatsRes, readinessRes] =
      await Promise.all([
        adminApiService.getDashboardStats(),
        adminApiService.getAiPipelineQualityStats({ days: 7 }),
        adminApiService.getAiPipelineCatalog(),
        adminApiService.getModuleStats(),
        adminApiService.getMarketplaceReadiness(UNIFIED_SEARCH_PILOT_MODULE_ID),
      ]);

    const errors: string[] = [];
    if (dashboardRes.error) errors.push(dashboardRes.error);
    if (pipelineRes.error) errors.push(pipelineRes.error);
    if (catalogRes.error) errors.push(catalogRes.error);
    if (moduleStatsRes.error) errors.push(moduleStatsRes.error);
    if (readinessRes.error) errors.push(readinessRes.error);

    const context = {
      dashboard: (dashboardRes.data as DashboardStats | undefined) ?? null,
      pipeline: pipelineRes.data ?? null,
      catalog: catalogRes.data ?? null,
      moduleStats: (moduleStatsRes.data as ModuleStatsPayload | undefined) ?? null,
      searchReadiness: readinessRes.data?.readiness ?? null,
    };

    const next: Partial<Record<PlatformProgramId, PlatformProgramHealthSnapshot>> = {};
    for (const program of PLATFORM_PROGRAM_DEFINITIONS) {
      const health = await loadProgramHealth(program, context);
      next[program.id] = { programId: program.id, ...health };
    }

    setHealthByProgram(next);
    if (errors.length > 0) {
      setError(errors[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { healthByProgram, loading, error, refresh };
}
