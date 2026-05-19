import { authenticatedApiCall } from '../lib/apiUtils';

export interface PendingLearningItem {
  id: string;
  title: string;
  content: string;
  contextType: string;
  createdAt: string;
}

export interface PendingLearningFromTwin {
  count: number;
  latest?: { id: string; title: string; content: string };
}

export async function fetchPendingLearnings(token: string): Promise<PendingLearningItem[]> {
  const res = await authenticatedApiCall<{ success: boolean; data: PendingLearningItem[] }>(
    '/api/ai/context/pending',
    { method: 'GET' },
    token
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function reviewPendingLearning(
  token: string,
  id: string,
  action: 'promote' | 'dismiss'
): Promise<void> {
  await authenticatedApiCall(
    `/api/ai/context/${id}/review`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
    token
  );
}
