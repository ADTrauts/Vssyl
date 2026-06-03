export interface NotebookAIGroundingWarnings {
  warnings: string[];
  restrictedLinks: number;
  trashedTargets: number;
  contentTruncated: boolean;
  emptyContent: boolean;
}

export interface NotebookPageSummaryResult {
  summary: string;
  keyDecisions: string[];
  openTasks: string[];
  risksAndFollowUps: string[];
  warnings: string[];
}

export interface NotebookActionItemProposal {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
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

export interface NotebookConfirmActionItemsInput {
  proposals: NotebookActionItemProposal[];
}

export interface NotebookConfirmActionItemsResult {
  created: Array<{ taskId: string; linkId: string; title: string }>;
  errors: Array<{ title: string; error: string }>;
  warnings: string[];
}
