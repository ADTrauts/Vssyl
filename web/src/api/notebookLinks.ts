function authHeaders(token: string, headers: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...headers,
  };
}

export type NotebookLinkTargetType = 'TASK' | 'FILE' | 'CALENDAR_EVENT';
export type NotebookLinkRelationshipType =
  | 'REFERENCE'
  | 'ACTION_SOURCE'
  | 'AGENDA'
  | 'EVIDENCE'
  | 'EMBED';

export interface NotebookLinkTarget {
  kind: 'task' | 'file' | 'event';
  id: string;
  title?: string;
  status?: string;
  dueDate?: string | null;
  name?: string;
  mimeType?: string | null;
  size?: number | null;
  extension?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  ownerName?: string | null;
  dashboardId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  onlineMeetingLink?: string | null;
  allDay?: boolean;
  attendeesSummary?: string | null;
  trashed?: boolean;
}

export interface EntityLinkPageSummary {
  id: string;
  title: string;
}

export interface EntityNotebookLinkItem {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  direction: string;
  createdAt: string;
  page?: EntityLinkPageSummary;
}

export interface EntityLinksResponse {
  entityType: string;
  entityId: string;
  links: EntityNotebookLinkItem[];
}

export interface NotebookLinkItem {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  direction: string;
  createdById: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  target?: NotebookLinkTarget;
  targetAccessible?: boolean;
}

export interface PageLinksResponse {
  pageId: string;
  links: NotebookLinkItem[];
}

export async function getPageLinks(
  token: string,
  pageId: string,
  options?: { targetType?: NotebookLinkTargetType; relationshipType?: NotebookLinkRelationshipType }
): Promise<PageLinksResponse> {
  if (!token) throw new Error('Authentication required');

  const params = new URLSearchParams();
  if (options?.targetType) params.set('targetType', options.targetType);
  if (options?.relationshipType) params.set('relationshipType', options.relationshipType);
  const qs = params.toString();
  const url = `/api/notebook/pages/${encodeURIComponent(pageId)}/links${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load links' }));
    throw new Error(err.error || 'Failed to load links');
  }
  return res.json();
}

export async function createPageLink(
  token: string,
  pageId: string,
  body: {
    targetType: NotebookLinkTargetType;
    targetId: string;
    relationshipType?: NotebookLinkRelationshipType;
    metadata?: Record<string, unknown>;
  }
): Promise<NotebookLinkItem> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notebook/pages/${encodeURIComponent(pageId)}/links`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create link' }));
    throw new Error(err.error || 'Failed to create link');
  }
  return res.json();
}

export async function getEntityLinks(
  token: string,
  entityType: 'CALENDAR_EVENT' | 'TASK' | 'FILE',
  entityId: string
): Promise<EntityLinksResponse> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(
    `/api/notebook/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/links`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load entity links' }));
    throw new Error(err.error || 'Failed to load entity links');
  }
  return res.json();
}

export async function archivePageLink(token: string, linkId: string): Promise<void> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notebook/links/${encodeURIComponent(linkId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: 'Failed to remove link' }));
    throw new Error(err.error || 'Failed to remove link');
  }
}
