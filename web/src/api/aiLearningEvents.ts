import { authenticatedApiCall } from '../lib/apiUtils';

export interface PersonalLearningEvent {
  id: string;
  eventType: string;
  context: string;
  sourceModule: string | null;
  oldBehavior: string | null;
  newBehavior: string;
  userFeedback: string | null;
  confidence: number;
  frequency: number;
  applied: boolean;
  validated: boolean;
  createdAt: string;
}

export async function fetchPersonalLearningEvents(
  token: string,
  status: 'pending' | 'validated' | 'all' = 'pending'
): Promise<PersonalLearningEvent[]> {
  const res = await authenticatedApiCall<{ success: boolean; data: PersonalLearningEvent[] }>(
    `/api/ai/learning/events?status=${status}`,
    { method: 'GET' },
    token
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function reviewPersonalLearningEvent(
  token: string,
  eventId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<void> {
  await authenticatedApiCall(
    `/api/ai/learning/events/${eventId}/review`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, ...(rejectionReason ? { rejectionReason } : {}) }),
    },
    token
  );
}
