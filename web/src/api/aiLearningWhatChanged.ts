import { authenticatedApiCall } from '../lib/apiUtils';

export interface LearningWhatChangedSummary {
  eventId?: string;
  eventType?: string;
  targetType: 'preference' | 'memory' | 'personality';
  targetId: string;
  beforeSummary: string;
  afterSummary: string;
  appliedAt: string;
  preferenceShiftNote?: string;
}

export async function fetchLearningWhatChanged(
  token: string
): Promise<LearningWhatChangedSummary | null> {
  const res = await authenticatedApiCall<{
    success: boolean;
    data: LearningWhatChangedSummary | null;
  }>('/api/ai/learning/what-changed', { method: 'GET' }, token);
  return res.success ? res.data ?? null : null;
}
