/**
 * AI Operations Center API client (Phase 4).
 * Uses Next.js proxy → /api/admin/ai/operations/*
 */
import type {
  AIExecutionDetailView,
  AIExecutionExplanation,
  AIExecutionListItem,
  AIOperationsCorrectionView,
  AIOperationsEvaluationView,
  AIOperationsMetricsResponse,
  AIOperationsOverview,
  AIOperationsPagination,
  AIOperationsRegressionView,
  AIOperationsWorkflowReport,
  AIReplayPreparationPreview,
} from 'shared/types';
import { getSession } from 'next-auth/react';

const API_BASE = '/api/admin/ai/operations';

type ApiResult<T> = { data?: T; error?: string };

async function getToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const token = await getToken();
  if (!token) return { error: 'Not authenticated' };
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error ?? `HTTP ${res.status}` };
  return { data: json.data as T };
}

export interface ListResponse<T> {
  items: T[];
  pagination: AIOperationsPagination;
}

export const aiOperationsApi = {
  getOverview: () => request<AIOperationsOverview>('/overview'),

  listExecutions: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
    }
    const q = qs.toString();
    return request<ListResponse<AIExecutionListItem>>(`/executions${q ? `?${q}` : ''}`);
  },

  getExecution: (id: string) => request<AIExecutionDetailView>(`/executions/${id}`),

  getExecutionEvents: (id: string) => request<unknown[]>(`/executions/${id}/events`),

  getExecutionTimeline: (id: string) => request<unknown[]>(`/executions/${id}/timeline`),

  getExecutionArtifacts: (id: string) =>
    request<Record<string, unknown>>(`/executions/${id}/artifacts`),

  getObservationHealth: () => request<Record<string, unknown>>(`/observation/health`),

  getObservationFailures: (limit?: number) =>
    request<unknown[]>(`/observation/failures${limit ? `?limit=${limit}` : ''}`),

  getExplainability: (id: string) =>
    request<AIExecutionExplanation>(`/executions/${id}/explain`),

  listEvaluations: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(params as Record<string, string>);
    const q = qs.toString();
    return request<ListResponse<AIOperationsEvaluationView>>(
      `/evaluations${q ? `?${q}` : ''}`
    );
  },

  updateEvaluation: (id: string, body: Record<string, unknown>) =>
    request(`/evaluations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  createEvaluation: (executionId: string, body: Record<string, unknown>) =>
    request(`/executions/${executionId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  addRootCauses: (evaluationId: string, body: Record<string, unknown>) =>
    request(`/evaluations/${evaluationId}/root-causes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  reviewRootCause: (rootCauseId: string, body: Record<string, unknown>) =>
    request(`/root-causes/${rootCauseId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  bulkUpdateEvaluations: (ids: string[], patch: Record<string, unknown>) =>
    request('/evaluations/bulk', { method: 'POST', body: JSON.stringify({ ids, patch }) }),

  listCorrections: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(params as Record<string, string>);
    const q = qs.toString();
    return request<ListResponse<AIOperationsCorrectionView>>(
      `/corrections${q ? `?${q}` : ''}`
    );
  },

  updateCorrection: (id: string, body: Record<string, unknown>) =>
    request(`/corrections/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listRegressions: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(params as Record<string, string>);
    const q = qs.toString();
    return request<ListResponse<AIOperationsRegressionView>>(
      `/regressions${q ? `?${q}` : ''}`
    );
  },

  updateRegression: (id: string, body: Record<string, unknown>) =>
    request(`/regressions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getWorkflowReport: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return request<AIOperationsWorkflowReport>(`/reports/workflow${q ? `?${q}` : ''}`);
  },

  getModelRoutingOverview: () =>
    request<{
      overview: import('shared/types').AIModelRoutingOpsOverview;
      policyVersion: string;
      capabilities: unknown[];
      tiers: unknown[];
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
    }>('/routing/overview'),

  getModelRoutingShadow: (limit?: number) => {
    const qs = new URLSearchParams();
    if (limit) qs.set('limit', String(limit));
    const q = qs.toString();
    return request<{ items: import('shared/types').AIModelRoutingShadowComparison[] }>(
      `/routing/shadow${q ? `?${q}` : ''}`
    );
  },

  getMetrics: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return request<AIOperationsMetricsResponse>(`/metrics${q ? `?${q}` : ''}`);
  },

  prepareReplay: (id: string, body: Record<string, unknown>) =>
    request<AIReplayPreparationPreview>(`/executions/${id}/replay/prepare`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getHealth: () =>
    request<{
      status: string;
      observeOnly: boolean;
      replayExecutionEnabled?: boolean;
      observation?: Record<string, unknown>;
    }>('/health'),
};
