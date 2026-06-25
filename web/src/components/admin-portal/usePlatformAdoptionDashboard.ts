'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApiService } from '../../lib/adminApiService';

export interface PlatformAdoptionModuleSummary {
  moduleId: string;
  displayName: string;
  category: string;
  adoptionLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  adoptionLevelLabel: string;
  score: number;
  certificationRef: string;
  lastValidated: string;
  topGap: string;
  missingCapabilities: string[];
  validationWarnings: string[];
}

export interface PlatformAdoptionFleetSummary {
  totalModules: number;
  averageScore: number;
  levelDistribution: Record<string, number>;
  modulesFullySearchable: number;
  modulesAiRetrievalFull: number;
  modulesKernelActivityFull: number;
  modulesContextGraphFull: number;
  marketplaceCapableModules: number;
  certificationDistribution: Record<string, number>;
  validationWarningCount: number;
  lastAssessedAt: string;
}

export interface PlatformAdoptionTrendPoint {
  date: string;
  label: string;
  averageScore: number;
  wave?: number;
}

export interface PlatformAdoptionDashboardData {
  fleet: PlatformAdoptionFleetSummary;
  modules: PlatformAdoptionModuleSummary[];
  trends: PlatformAdoptionTrendPoint[];
  validation: {
    assessedAt: string;
    warnings: Array<{ code: string; severity: string; moduleId?: string; message: string }>;
    errorCount: number;
    warningCount: number;
  };
}

export function usePlatformAdoptionDashboard() {
  const [data, setData] = useState<PlatformAdoptionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getPlatformAdoptionDashboard();
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load platform adoption data');
      setLoading(false);
      return;
    }
    setData(res.data as PlatformAdoptionDashboardData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function usePlatformAdoptionModuleDetail(moduleId: string) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApiService.getPlatformAdoptionModuleDetail(moduleId);
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load module adoption detail');
      setLoading(false);
      return;
    }
    setDetail(res.data as Record<string, unknown>);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh };
}
