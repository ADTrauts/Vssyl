export type WorkspaceInsightSeverity = 'info' | 'warning' | 'critical';

export interface NotebookWorkspacePageSummary {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
}

export interface NotebookWorkspaceTaskSummary {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  priority: string;
}

export interface NotebookWorkspaceMeetingSummary {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string | null;
  allDay: boolean;
  pageId?: string | null;
  pageTitle?: string | null;
}

export interface NotebookWorkspaceFileSummary {
  id: string;
  name: string;
  mimeType: string;
  updatedAt: string;
  linkedPageId?: string | null;
}

export interface NotebookWorkspaceActivitySummary {
  recentLinkActions: number;
  linksByTargetType: Partial<Record<'TASK' | 'FILE' | 'CALENDAR_EVENT', number>>;
  lastLinkAt: string | null;
}

export interface NotebookWorkspaceInsight {
  type: string;
  severity: WorkspaceInsightSeverity;
  count?: number;
  message: string;
  pageId?: string;
}

export interface NotebookWorkspaceContext {
  dashboardId: string;
  businessId: string | null;
  greetingName: string | null;
  recentPages: NotebookWorkspacePageSummary[];
  pinnedPages: NotebookWorkspacePageSummary[];
  favoritePages: NotebookWorkspacePageSummary[];
  openTasks: NotebookWorkspaceTaskSummary[];
  overdueTasks: NotebookWorkspaceTaskSummary[];
  dueSoonTasks: NotebookWorkspaceTaskSummary[];
  upcomingMeetings: NotebookWorkspaceMeetingSummary[];
  recentMeetingPages: NotebookWorkspacePageSummary[];
  recentFiles: NotebookWorkspaceFileSummary[];
  activitySummary: NotebookWorkspaceActivitySummary;
  workspaceInsights: NotebookWorkspaceInsight[];
  suggestedFocus: string[];
  generatedAt: string;
}
