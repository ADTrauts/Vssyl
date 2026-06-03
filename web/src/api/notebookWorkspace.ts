function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface NotebookWorkspaceContext {
  dashboardId: string;
  businessId: string | null;
  greetingName: string | null;
  recentPages: Array<{ id: string; title: string; updatedAt: string; pinned: boolean; tags: string[] }>;
  pinnedPages: Array<{ id: string; title: string; updatedAt: string; pinned: boolean; tags: string[] }>;
  favoritePages: Array<{ id: string; title: string; updatedAt: string; pinned: boolean; tags: string[] }>;
  openTasks: Array<{ id: string; title: string; status: string; dueDate: string | null; priority: string }>;
  overdueTasks: Array<{ id: string; title: string; status: string; dueDate: string | null; priority: string }>;
  dueSoonTasks: Array<{ id: string; title: string; status: string; dueDate: string | null; priority: string }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    location: string | null;
    allDay: boolean;
    pageId?: string | null;
    pageTitle?: string | null;
  }>;
  recentMeetingPages: Array<{ id: string; title: string; updatedAt: string }>;
  recentFiles: Array<{ id: string; name: string; mimeType: string; updatedAt: string }>;
  activitySummary: {
    recentLinkActions: number;
    lastLinkAt: string | null;
  };
  workspaceInsights: Array<{
    type: string;
    severity: string;
    count?: number;
    message: string;
  }>;
  suggestedFocus: string[];
  generatedAt: string;
}

export async function getWorkspaceContext(
  token: string,
  dashboardId: string,
  businessId?: string | null
): Promise<NotebookWorkspaceContext> {
  const params = new URLSearchParams({ dashboardId });
  if (businessId) params.set('businessId', businessId);
  const res = await fetch(`/api/notebook/workspace/context?${params}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load workspace');
  }
  return res.json();
}
