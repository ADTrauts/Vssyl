/**
 * AI Identity snapshot — unified home tab data from GET /api/ai/identity
 */

import type { EffectivePreferencesPreview } from './aiEffectivePreferences';

export type InfluencePermanence = 'permanent' | 'learned' | 'workspace' | 'session';

export interface AIIdentityInfluence {
  id: string;
  label: string;
  detail?: string;
  permanence: InfluencePermanence;
}

export interface AIIdentitySnapshot {
  preview: EffectivePreferencesPreview;
  communicationSummary: string;
  influences: AIIdentityInfluence[];
  learning: {
    pendingCount: number;
    pendingContextCount: number;
    pendingEventCount: number;
  };
  context: {
    scope: 'personal' | 'business';
    businessName?: string;
    memoryFactCount: number;
    learnedContextCount: number;
    userContextCount: number;
    modules: Array<{ id: string; name: string }>;
  };
  businessOverlay?: {
    active: boolean;
    businessId: string;
    businessName?: string;
    policySummary: string[];
  };
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchAIIdentitySnapshot(
  token: string,
  options?: { businessId?: string; dashboardId?: string }
): Promise<AIIdentitySnapshot | null> {
  const params = new URLSearchParams();
  if (options?.businessId) params.set('businessId', options.businessId);
  if (options?.dashboardId) params.set('dashboardId', options.dashboardId);
  const qs = params.toString();
  const res = await fetch(`/api/ai/identity${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data?: AIIdentitySnapshot };
  return json.success && json.data ? json.data : null;
}
