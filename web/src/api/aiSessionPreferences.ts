import { authenticatedApiCall } from '../lib/apiUtils';

export interface SessionPreferenceAdjustments {
  tone?: string;
  verbosity?: string;
  recommendationRichness?: string;
  structurePreference?: string;
  summary?: string;
}

export async function promoteSessionPreferences(
  token: string,
  adjustments: SessionPreferenceAdjustments
): Promise<void> {
  await authenticatedApiCall(
    '/api/ai/preferences/promote-session',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustments),
    },
    token
  );
}
