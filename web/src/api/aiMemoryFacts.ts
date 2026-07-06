/**
 * User memory facts API (structured long-term memory).
 */

export type MemoryFactSourceType =
  | 'explicit_user'
  | 'remember_that'
  | 'inferred_chat'
  | 'questionnaire'
  | 'import';

export type MemoryFactCategory =
  | 'preference'
  | 'person'
  | 'project'
  | 'constraint'
  | 'location'
  | 'other';

export interface UserMemoryFact {
  id: string;
  subject: string;
  predicate: string;
  scope: string;
  businessId?: string | null;
  sourceType: MemoryFactSourceType;
  category: MemoryFactCategory;
  isExplicit: boolean;
  sourceConversationId?: string | null;
  confidence: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListMemoryFactsOptions {
  scope?: string;
  businessId?: string;
  category?: MemoryFactCategory;
  sourceType?: MemoryFactSourceType;
}

/** Matches server MEMORY_PINNED_CONFIDENCE — pinned facts get retrieval priority via confidence. */
export const MEMORY_PINNED_CONFIDENCE = 0.95;

export function isMemoryFactPinned(fact: Pick<UserMemoryFact, 'confidence'>): boolean {
  return fact.confidence >= MEMORY_PINNED_CONFIDENCE;
}

const SOURCE_LABELS: Record<MemoryFactSourceType, string> = {
  explicit_user: 'You added this',
  remember_that: 'From chat',
  inferred_chat: 'Inferred',
  questionnaire: 'From profile',
  import: 'Imported',
};

const CATEGORY_LABELS: Record<MemoryFactCategory, string> = {
  preference: 'Preference',
  person: 'Person',
  project: 'Project',
  constraint: 'Constraint',
  location: 'Location',
  other: 'General',
};

export function memoryFactSourceLabel(sourceType: MemoryFactSourceType): string {
  return SOURCE_LABELS[sourceType] ?? 'Memory';
}

export function memoryFactCategoryLabel(category: MemoryFactCategory): string {
  return CATEGORY_LABELS[category] ?? 'General';
}

/** Plain-language explanation for “Why I remembered this”. */
export function memoryFactWhyExplanation(fact: UserMemoryFact): string {
  switch (fact.sourceType) {
    case 'explicit_user':
      return 'You added this directly in Memory. Your twin treats it as something you want remembered.';
    case 'remember_that':
      return 'Saved when you asked your twin to “remember that…” in chat.';
    case 'inferred_chat':
      return 'Your twin inferred this from a conversation. Review or delete it if it is wrong.';
    case 'questionnaire':
      return 'Derived from your AI Identity or personality setup.';
    case 'import':
      return 'Imported from another source into your memory store.';
    default:
      return 'Stored as a long-term memory for future replies.';
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function buildListQuery(options?: ListMemoryFactsOptions): string {
  if (!options) return '';
  const params = new URLSearchParams();
  if (options.scope) params.set('scope', options.scope);
  if (options.businessId) params.set('businessId', options.businessId);
  if (options.category) params.set('category', options.category);
  if (options.sourceType) params.set('sourceType', options.sourceType);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listMemoryFacts(
  token: string,
  options?: ListMemoryFactsOptions
): Promise<UserMemoryFact[]> {
  const res = await fetch(`/api/ai/memory/facts${buildListQuery(options)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to load memory facts');
  const json = (await res.json()) as { success: boolean; data?: { facts: UserMemoryFact[] } };
  return json.data?.facts ?? [];
}

export async function createMemoryFact(
  token: string,
  body: {
    subject: string;
    predicate: string;
    scope?: string;
    businessId?: string;
    category?: MemoryFactCategory;
    sourceConversationId?: string;
    expiresAt?: string | null;
  }
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

export async function updateMemoryFact(
  token: string,
  id: string,
  body: {
    subject?: string;
    predicate?: string;
    category?: MemoryFactCategory;
    confidence?: number;
    expiresAt?: string | null;
  }
): Promise<UserMemoryFact> {
  const res = await fetch(`/api/ai/memory/facts/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to update memory fact');
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
