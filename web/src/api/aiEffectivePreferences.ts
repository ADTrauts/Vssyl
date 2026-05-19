/**
 * Effective AI preferences preview (what the brain uses on the next chat turn).
 */

export interface EffectivePreferencesPreview {
  preferenceScope?: 'personal';
  scopeNote?: string;
  communication: {
    tone: string;
    verbosity: string;
    styleSummary: string;
  };
  response: {
    structure: string;
    recommendationStyle: string;
  };
  actionBoundaries: string[];
  provider: {
    provider: string;
    modelLabel: string | null;
  };
  setup: {
    hasPersonalityProfile: boolean;
    hasAutonomySettings: boolean;
    inferredHintCount: number;
  };
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchEffectivePreferencesPreview(
  token: string
): Promise<EffectivePreferencesPreview | null> {
  const res = await fetch('/api/ai/effective-preferences', { headers: authHeaders(token) });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data?: EffectivePreferencesPreview };
  return json.success && json.data ? json.data : null;
}
