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

  getHealth: () => request<{ status: string; observeOnly: boolean }>('/health'),
};
