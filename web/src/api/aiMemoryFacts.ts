/**
 * User memory facts API (structured long-term memory).
 */

export interface UserMemoryFact {
  id: string;
  subject: string;
  predicate: string;
  scope: string;
  businessId?: string | null;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function listMemoryFacts(
  token: string,
  scope?: string
): Promise<UserMemoryFact[]> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await fetch(`/api/ai/memory/facts${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load memory facts');
  const json = (await res.json()) as { success: boolean; data?: { facts: UserMemoryFact[] } };
  return json.data?.facts ?? [];
}

export async function createMemoryFact(
  token: string,
  body: { subject: string; predicate: string; scope?: string; businessId?: string }
): Promise<UserMemoryFact> {
  const res = await fetch('/api/ai/memory/facts', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create memory fact');
  const json = (await res.json()) as { success: boolean; data: UserMemoryFact };
  return json.data;
}

export async function deleteMemoryFact(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/ai/memory/facts/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete memory fact');
}
