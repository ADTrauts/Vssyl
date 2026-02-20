import { authenticatedApiCall } from '../lib/apiUtils';

export interface AISuggestionItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  actionData: Record<string, unknown> | null;
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED';
  respondedAt: Date | null;
  createdAt: string;
}

export interface SuggestionsListResponse {
  success: boolean;
  data: AISuggestionItem[];
}

export interface AcceptSuggestionResponse {
  success: boolean;
  data: { suggestionId: string; actionUrl: string; fileId?: string; suggestedPrompt?: string };
}

export interface DismissSuggestionResponse {
  success: boolean;
  data: { suggestionId: string };
}

export async function getSuggestions(token?: string): Promise<AISuggestionItem[]> {
  const res = await authenticatedApiCall<SuggestionsListResponse>(
    '/api/ai/suggestions',
    { method: 'GET' },
    token
  );
  if (!res.success || !Array.isArray(res.data)) return [];
  return res.data;
}

export async function acceptSuggestion(
  suggestionId: string,
  token?: string
): Promise<AcceptSuggestionResponse['data']> {
  const res = await authenticatedApiCall<AcceptSuggestionResponse>(
    `/api/ai/suggestions/${encodeURIComponent(suggestionId)}/accept`,
    { method: 'POST' },
    token
  );
  if (!res.success || !res.data) throw new Error('Failed to accept suggestion');
  return res.data;
}

export async function dismissSuggestion(
  suggestionId: string,
  token?: string
): Promise<void> {
  const res = await authenticatedApiCall<DismissSuggestionResponse>(
    `/api/ai/suggestions/${encodeURIComponent(suggestionId)}/dismiss`,
    { method: 'POST' },
    token
  );
  if (!res.success) throw new Error('Failed to dismiss suggestion');
}
