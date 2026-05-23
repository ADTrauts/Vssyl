/**
 * Ambient contextual assistance — suggestion types (Phase 5A).
 */

export const SUGGESTION_TYPES = {
  DOCUMENT_UPLOAD: 'document_upload',
  MEETING_PREP: 'meeting_prep',
  FILE_REVIEW: 'file_review',
  THREAD_SUMMARY: 'thread_summary',
  DEADLINE_RISK: 'deadline_risk',
  BUSINESS_OPS: 'business_ops',
  RECURRING_ROUTINE: 'recurring_routine',
  MODULE_SPECIFIC: 'module_specific',
} as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[keyof typeof SUGGESTION_TYPES];

export const CORRELATION_RULE_IDS = {
  DOCUMENT_UPLOAD_V1: 'document_upload_v1',
  MEETING_PREP_V1: 'meeting_prep_v1',
  FILE_AFTER_CHAT_V1: 'file_after_chat_v1',
  THREAD_ACTIVITY_SPIKE_V1: 'thread_activity_spike_v1',
} as const;

export interface MeetingPrepActionData {
  eventId: string;
  calendarId: string;
  relatedFileIds: string[];
  suggestedPrompt: string;
  deepLink?: string;
}

export interface FileReviewActionData {
  fileId: string;
  fileName: string;
  conversationId?: string;
  suggestedPrompt: string;
  deepLink?: string;
}

export interface ThreadSummaryActionData {
  conversationId: string;
  threadId?: string;
  messageCount: number;
  suggestedPrompt: string;
  deepLink?: string;
}

/** Correlation windows (Phase 5C). */
export const CORRELATION_WINDOWS = {
  MEETING_PREP_FUTURE_MS: 48 * 60 * 60 * 1000,
  FILE_AFTER_CHAT_MS: 4 * 60 * 60 * 1000,
  THREAD_SPIKE_MS: 2 * 60 * 60 * 1000,
  THREAD_SPIKE_MIN_MESSAGES: 10,
  MEETING_PREP_MIN_FILES: 1,
} as const;

export interface SuggestionContextUsed {
  moduleId: string;
  reason: string;
}

export interface SuggestionExplainability {
  summary: string;
  contextUsed: SuggestionContextUsed[];
  correlationReason: string;
  sourceEventIds: string[];
}

export interface DocumentUploadActionData {
  fileId: string;
  fileName: string;
  suggestedActions: ('extract_document' | 'add_reminder')[];
  suggestedPrompt: string;
  deepLink?: string;
}

export const DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export function isDocumentMime(mimetype: string): boolean {
  const lower = mimetype.toLowerCase();
  if (DOCUMENT_MIMES.some((m) => lower === m)) return true;
  if (lower.startsWith('text/') || lower.includes('pdf') || lower.includes('document')) return true;
  return false;
}

export const DEFAULT_SUGGESTION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SUPPRESSION_BLOCK_MS = 90 * 24 * 60 * 60 * 1000;
export const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Phase 5E — ranking decay after dismissals (per suggestion type). */
export const DISMISSAL_DECAY_PER_EVENT = 0.08;
export const MIN_RULE_CONFIDENCE_FLOOR = 0.5;
export const DISMISSAL_DECAY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Phase 5E — repeated accepts → reviewable Learning proposal. */
export const REPEATED_ACCEPT_THRESHOLD = 3;
export const REPEATED_ACCEPT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const SUGGESTION_PREFERENCE_DEDUPE_TAG = 'ambient_suggestion';
