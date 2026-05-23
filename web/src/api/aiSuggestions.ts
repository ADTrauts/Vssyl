import { authenticatedApiCall } from '../lib/apiUtils';

export interface SuggestionContextUsed {
  moduleId: string;
  reason: string;
}

export interface SuggestionExplainability {
  summary: string;
  contextUsed: SuggestionContextUsed[];
  correlationReason: string;
  sourceEventIds: string[];
}

export type AISuggestionStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';

export interface AISuggestionItem {
  id: string;
  userId: string;
  type: string;
  suggestionType?: string | null;
  title: string;
  body: string | null;
  actionData: Record<string, unknown> | null;
  status: AISuggestionStatus;
  confidence?: number | null;
  explainability?: SuggestionExplainability | null;
  correlationRuleId?: string | null;
  respondedAt: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export interface SuggestionsListResponse {
  success: boolean;
  data: AISuggestionItem[];
}

export interface SuggestionDetailResponse {
  success: boolean;
  data: AISuggestionItem & { explain?: SuggestionExplainability | null };
}

export interface AcceptSuggestionResponse {
  success: boolean;
  data: { suggestionId: string; actionUrl: string; fileId?: string; suggestedPrompt?: string };
}

export interface DismissSuggestionResponse {
  success: boolean;
  data: { suggestionId: string };
}

export type SuggestionListScope = 'pending' | 'history' | 'all';

export interface GetSuggestionsOptions {
  dashboardId?: string;
  businessId?: string;
  scope?: SuggestionListScope;
}

function buildSuggestionsQuery(options?: GetSuggestionsOptions): string {
  const params = new URLSearchParams();
  if (options?.dashboardId) params.set('dashboardId', options.dashboardId);
  if (options?.businessId) params.set('businessId', options.businessId);
  if (options?.scope && options.scope !== 'pending') {
    params.set('scope', options.scope);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getSuggestions(
  token?: string,
  options?: GetSuggestionsOptions
): Promise<AISuggestionItem[]> {
  const res = await authenticatedApiCall<SuggestionsListResponse>(
    `/api/ai/suggestions${buildSuggestionsQuery(options)}`,
    { method: 'GET' },
    token
  );
  if (!res.success || !Array.isArray(res.data)) return [];
  return res.data;
}

export async function getSuggestionById(
  suggestionId: string,
  token?: string
): Promise<(AISuggestionItem & { explain?: SuggestionExplainability | null }) | null> {
  const res = await authenticatedApiCall<SuggestionDetailResponse>(
    `/api/ai/suggestions/${encodeURIComponent(suggestionId)}`,
    { method: 'GET' },
    token
  );
  if (!res.success || !res.data) return null;
  return res.data;
}

export async function dismissSuggestion(
  suggestionId: string,
  token?: string,
  options?: { reason?: string; doNotShowAgain?: boolean; dashboardId?: string; businessId?: string }
): Promise<void> {
  const res = await authenticatedApiCall<DismissSuggestionResponse>(
    `/api/ai/suggestions/${encodeURIComponent(suggestionId)}/dismiss`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {}),
    },
    token
  );
  if (!res.success) throw new Error('Failed to dismiss suggestion');
}

export async function acceptSuggestion(
  suggestionId: string,
  token?: string,
  options?: { dashboardId?: string; businessId?: string }
): Promise<AcceptSuggestionResponse['data']> {
  const res = await authenticatedApiCall<AcceptSuggestionResponse>(
    `/api/ai/suggestions/${encodeURIComponent(suggestionId)}/accept`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {}),
    },
    token
  );
  if (!res.success || !res.data) throw new Error('Failed to accept suggestion');
  return res.data;
}

/** Normalize explainability from list payload or detail `explain` field. */
export function resolveSuggestionExplainability(
  suggestion: AISuggestionItem & { explain?: SuggestionExplainability | null }
): SuggestionExplainability | null {
  if (suggestion.explainability && typeof suggestion.explainability === 'object') {
    return suggestion.explainability;
  }
  if (suggestion.explain && typeof suggestion.explain === 'object') {
    return suggestion.explain;
  }
  return null;
}
