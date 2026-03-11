/**
 * Notes Module API Client
 * Uses native fetch; all requests go through Next.js API proxy (/api/notes -> backend)
 */

function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  dashboardId: string;
  businessId?: string | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  canEdit?: boolean;
}

export interface GetNotesParams {
  dashboardId: string;
  businessId?: string | null;
  search?: string;
  tag?: string;
  pinned?: boolean;
  folderId?: string | null;
  sharedWithMe?: boolean;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  dashboardId: string;
  businessId?: string | null;
  tags?: string[];
  pinned?: boolean;
  folderId?: string | null;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  folderId?: string | null;
}

export interface NoteFolder {
  id: string;
  name: string;
  dashboardId: string;
  businessId?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { notes: number };
}

export interface GetFoldersParams {
  dashboardId: string;
  businessId?: string | null;
}

export interface CreateFolderInput {
  name: string;
  dashboardId: string;
  businessId?: string | null;
  parentId?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
}

export async function getNotes(token: string, params: GetNotesParams): Promise<Note[]> {
  if (!token) throw new Error('Authentication required');

  const q = new URLSearchParams();
  q.set('dashboardId', params.dashboardId);
  if (params.businessId != null && params.businessId !== '') q.set('businessId', String(params.businessId));
  if (params.search) q.set('search', params.search);
  if (params.tag) q.set('tag', params.tag);
  if (params.pinned !== undefined) q.set('pinned', String(params.pinned));
  if (params.folderId !== undefined && params.folderId !== null) {
    q.set('folderId', params.folderId === '' || params.folderId === 'none' ? 'none' : params.folderId);
  }
  if (params.sharedWithMe === true) q.set('sharedWithMe', 'true');

  const res = await fetch(`/api/notes?${q.toString()}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch notes' }));
    throw new Error(err.error || 'Failed to fetch notes');
  }

  const data = await res.json();
  return data.notes ?? [];
}

export async function getNoteById(token: string, id: string): Promise<Note | null> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${id}`, {
    headers: authHeaders(token),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch note' }));
    throw new Error(err.error || 'Failed to fetch note');
  }

  return res.json();
}

export async function createNote(token: string, input: CreateNoteInput): Promise<Note> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create note' }));
    throw new Error(err.error || 'Failed to create note');
  }

  return res.json();
}

export async function updateNote(token: string, id: string, input: UpdateNoteInput): Promise<Note> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update note' }));
    throw new Error(err.error || 'Failed to update note');
  }

  return res.json();
}

export async function deleteNote(token: string, id: string): Promise<void> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete note' }));
    throw new Error(err.error || 'Failed to delete note');
  }
}

export async function getFolders(token: string, params: GetFoldersParams): Promise<NoteFolder[]> {
  if (!token) throw new Error('Authentication required');

  const q = new URLSearchParams();
  q.set('dashboardId', params.dashboardId);
  if (params.businessId != null && params.businessId !== '') q.set('businessId', String(params.businessId));

  const res = await fetch(`/api/notes/folders?${q.toString()}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch folders' }));
    throw new Error(err.error || 'Failed to fetch folders');
  }

  const data = await res.json();
  return data.folders ?? [];
}

export async function createFolder(token: string, input: CreateFolderInput): Promise<NoteFolder> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch('/api/notes/folders', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create folder' }));
    throw new Error(err.error || 'Failed to create folder');
  }

  return res.json();
}

export async function updateFolder(token: string, id: string, input: UpdateFolderInput): Promise<NoteFolder> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/folders/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update folder' }));
    throw new Error(err.error || 'Failed to update folder');
  }

  return res.json();
}

export async function deleteFolder(token: string, id: string): Promise<void> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/folders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete folder' }));
    throw new Error(err.error || 'Failed to delete folder');
  }
}

export interface NoteShareEntry {
  id: string;
  sharedWithUserId: string;
  role: string;
  createdAt: string;
  sharedWith: { id: string; name: string | null; email: string | null };
}

export async function getNoteShares(token: string, noteId: string): Promise<NoteShareEntry[]> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${noteId}/shares`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch shares' }));
    throw new Error(err.error || 'Failed to fetch shares');
  }

  const data = await res.json();
  return data.shares ?? [];
}

export async function shareNote(
  token: string,
  noteId: string,
  sharedWithUserId: string,
  role: 'viewer' | 'editor'
): Promise<{ id: string; noteId: string; sharedWithUserId: string; role: string; createdAt: string }> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${noteId}/share`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ sharedWithUserId, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to share note' }));
    throw new Error(err.error || 'Failed to share note');
  }

  return res.json();
}

export async function revokeNoteShare(token: string, noteId: string, targetUserId: string): Promise<void> {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`/api/notes/${noteId}/share/${targetUserId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: 'Failed to revoke share' }));
    throw new Error(err.error || 'Failed to revoke share');
  }
}
