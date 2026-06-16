/**
 * V_Link API Client — proxied via /api/vlinks
 */

function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export type VLinkScope = 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
export type VLinkStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type VLinkMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type VLinkEntityType =
  | 'FILE'
  | 'FOLDER'
  | 'CALENDAR_EVENT'
  | 'CHAT_CONVERSATION'
  | 'CHAT_THREAD'
  | 'TASK'
  | 'TODO'
  | 'NOTE'
  | 'DASHBOARD'
  | 'WIDGET'
  | 'USER'
  | 'BUSINESS'
  | 'HOUSEHOLD'
  | 'MODULE_ENTITY'
  | 'WORKFORCE_COMMUNICATION'
  | 'WORKFORCE_CAMPAIGN';

export interface VLinkEntityCounts {
  accessible: Record<string, number>;
  restricted: number;
}

export interface VLinkSummary {
  id: string;
  publicCode: string;
  title: string;
  description?: string | null;
  scope: VLinkScope;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  ownerUserId: string;
  parentVLinkId?: string | null;
  color?: string | null;
  icon?: string | null;
  status: VLinkStatus;
  createdAt: string;
  updatedAt: string;
  entityCounts: VLinkEntityCounts;
  childVLinkCount: number;
  membershipRole?: VLinkMemberRole | null;
}

export interface VLinkEntityRow {
  id: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string | null;
  access: 'full' | 'restricted';
  title?: string;
  url?: string;
  linkedAt: string;
}

export interface VLinkMemberRow {
  id: string;
  userId: string;
  role: VLinkMemberRole;
  acceptedAt?: string | null;
  user: { id: string; name?: string | null; email: string; image?: string | null };
}

export interface VLinkActivityRow {
  id: string;
  action: string;
  entityType?: VLinkEntityType | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actorUserId?: string | null;
}

export interface VLinkSuggestionRow {
  id: string;
  vlinkId?: string | null;
  suggestedTitle?: string | null;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string | null;
  status: string;
  confidence?: number | null;
  createdAt: string;
}

export interface EntityVLinkRef {
  id: string;
  publicCode: string;
  title: string;
  scope: VLinkScope;
  entityLinkId: string;
}

export interface CreateVLinkInput {
  title: string;
  description?: string;
  scope: VLinkScope;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  parentVLinkId?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface LinkEntityInput {
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string;
  replacePrimary?: boolean;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export async function listVLinks(
  token: string,
  params: {
    dashboardId?: string;
    scope?: VLinkScope;
    businessId?: string;
    householdId?: string;
    sharedWithMe?: boolean;
    archived?: boolean;
    cursor?: string;
  } = {}
): Promise<{ vlinks: VLinkSummary[]; nextCursor?: string }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  });
  const res = await fetch(`/api/vlinks?${qs.toString()}`, { headers: authHeaders(token) });
  const data = await parseJson<{ vlinks: VLinkSummary[]; nextCursor?: string }>(res);
  return { vlinks: data.vlinks, nextCursor: data.nextCursor };
}

export async function getVLink(token: string, idOrCode: string): Promise<VLinkSummary> {
  const res = await fetch(`/api/vlinks/${encodeURIComponent(idOrCode)}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson<{ vlink: VLinkSummary }>(res);
  return data.vlink;
}

export async function createVLink(token: string, input: CreateVLinkInput): Promise<VLinkSummary> {
  const res = await fetch('/api/vlinks', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ vlink: VLinkSummary }>(res);
  return data.vlink;
}

export async function updateVLink(
  token: string,
  id: string,
  patch: Partial<CreateVLinkInput>
): Promise<VLinkSummary> {
  const res = await fetch(`/api/vlinks/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  const data = await parseJson<{ vlink: VLinkSummary }>(res);
  return data.vlink;
}

export async function archiveVLink(token: string, id: string, includeSubtree?: boolean): Promise<void> {
  const res = await fetch(`/api/vlinks/${id}/archive`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ includeSubtree }),
  });
  await parseJson(res);
}

export async function restoreVLink(token: string, id: string, includeSubtree?: boolean): Promise<void> {
  const res = await fetch(`/api/vlinks/${id}/restore`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ includeSubtree }),
  });
  await parseJson(res);
}

export async function deleteVLink(
  token: string,
  id: string,
  strategy?: 'block' | 'archive_subtree' | 'reparent_children'
): Promise<void> {
  const res = await fetch(`/api/vlinks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ strategy }),
  });
  await parseJson(res);
}

export async function linkEntityToVLink(
  token: string,
  vlinkId: string,
  input: LinkEntityInput
): Promise<void> {
  const res = await fetch(`/api/vlinks/${vlinkId}/entities`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  await parseJson(res);
}

export async function unlinkEntityFromVLink(
  token: string,
  vlinkId: string,
  entityLinkId: string
): Promise<void> {
  const res = await fetch(`/api/vlinks/${vlinkId}/entities/${entityLinkId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await parseJson(res);
}

export async function getVLinksForEntity(
  token: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<EntityVLinkRef[]> {
  const res = await fetch(`/api/vlinks/entity/${entityType}/${entityId}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson<{ vlinks: EntityVLinkRef[] }>(res);
  return data.vlinks;
}

export async function listVLinkEntities(
  token: string,
  vlinkId: string,
  entityType?: VLinkEntityType
): Promise<VLinkEntityRow[]> {
  const qs = entityType ? `?entityType=${entityType}` : '';
  const res = await fetch(`/api/vlinks/${vlinkId}/entities${qs}`, { headers: authHeaders(token) });
  const data = await parseJson<{ entities: VLinkEntityRow[] }>(res);
  return data.entities;
}

export async function listVLinkMembers(token: string, vlinkId: string): Promise<VLinkMemberRow[]> {
  const res = await fetch(`/api/vlinks/${vlinkId}/members`, { headers: authHeaders(token) });
  const data = await parseJson<{ members: VLinkMemberRow[] }>(res);
  return data.members;
}

export async function inviteVLinkMember(
  token: string,
  vlinkId: string,
  userId: string,
  role: VLinkMemberRole
): Promise<void> {
  const res = await fetch(`/api/vlinks/${vlinkId}/members`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId, role }),
  });
  await parseJson(res);
}

export async function transferVLinkOwnership(
  token: string,
  vlinkId: string,
  newOwnerUserId: string
): Promise<void> {
  const res = await fetch(`/api/vlinks/${vlinkId}/ownership/transfer`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ newOwnerUserId }),
  });
  await parseJson(res);
}

export async function listVLinkActivity(
  token: string,
  vlinkId: string
): Promise<VLinkActivityRow[]> {
  const res = await fetch(`/api/vlinks/${vlinkId}/activity`, { headers: authHeaders(token) });
  const data = await parseJson<{ activities: VLinkActivityRow[] }>(res);
  return data.activities;
}

export async function listVLinkSuggestions(token: string): Promise<VLinkSuggestionRow[]> {
  const res = await fetch('/api/vlinks/suggestions', { headers: authHeaders(token) });
  const data = await parseJson<{ suggestions: VLinkSuggestionRow[] }>(res);
  return data.suggestions;
}

export async function acceptVLinkSuggestion(
  token: string,
  suggestionId: string,
  vlinkId?: string
): Promise<void> {
  const res = await fetch(`/api/vlinks/suggestions/${suggestionId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ vlinkId }),
  });
  await parseJson(res);
}

export async function rejectVLinkSuggestion(token: string, suggestionId: string): Promise<void> {
  const res = await fetch(`/api/vlinks/suggestions/${suggestionId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  await parseJson(res);
}

export async function searchVLinks(token: string, q: string) {
  const res = await fetch(`/api/vlinks/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson<{ results: Array<{ id: string; title: string; publicCode: string; url: string }> }>(res);
  return data.results;
}
