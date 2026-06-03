function authHeaders(token: string, headers: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...headers,
  };
}

export interface NotebookActionItemProposal {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
}

export interface NotebookPageSummaryResult {
  summary: string;
  keyDecisions: string[];
  openTasks: string[];
  risksAndFollowUps: string[];
  warnings: string[];
}

export interface NotebookExtractActionItemsResult {
  proposals: NotebookActionItemProposal[];
  warnings: string[];
}

export interface NotebookMeetingRecapResult {
  recap: string;
  decisions: string[];
  actionItems: NotebookActionItemProposal[];
  followUpAgenda: string[];
  warnings: string[];
}

export interface NotebookLinkSuggestion {
  targetType: 'TASK' | 'FILE' | 'CALENDAR_EVENT';
  targetId: string;
  label: string;
  reason: string;
}

export interface NotebookSuggestLinksResult {
  suggestions: NotebookLinkSuggestion[];
  warnings: string[];
}

export interface NotebookConfirmActionItemsResult {
  created: Array<{ taskId: string; linkId: string; title: string }>;
  errors: Array<{ title: string; error: string }>;
  warnings: string[];
}

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  const msg = typeof body?.error === 'string' ? body.error : res.statusText;
  throw new Error(msg || 'Request failed');
}

export async function summarizePage(token: string, pageId: string): Promise<NotebookPageSummaryResult> {
  const res = await fetch(`/api/notebook/pages/${pageId}/ai/summary`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function extractActionItems(
  token: string,
  pageId: string,
  options?: { selectedText?: string }
): Promise<NotebookExtractActionItemsResult> {
  const res = await fetch(`/api/notebook/pages/${pageId}/ai/action-items`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(options ?? {}),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function confirmActionItems(
  token: string,
  pageId: string,
  proposals: NotebookActionItemProposal[]
): Promise<NotebookConfirmActionItemsResult> {
  const res = await fetch(`/api/notebook/pages/${pageId}/ai/action-items/confirm`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ proposals }),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function meetingRecap(token: string, pageId: string): Promise<NotebookMeetingRecapResult> {
  const res = await fetch(`/api/notebook/pages/${pageId}/ai/meeting-recap`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function suggestLinks(token: string, pageId: string): Promise<NotebookSuggestLinksResult> {
  const res = await fetch(`/api/notebook/pages/${pageId}/ai/suggest-links`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}
