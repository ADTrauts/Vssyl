/**
 * Central handler for AI twin API response → conversation item.
 * Single place for defaults and shape so ai-chat page, AIChatDropdown, and AIChatModule stay in sync.
 */

import type { StructuredAIResponse } from '../components/ai/AIResponseRenderer';

/** Phase 5: file/attachment issues for UI to render (message is user-facing). */
export interface FileIssue {
  fileId: string;
  code: string;
  message: string;
  details?: string;
  developerDetails?: string;
}

export interface TwinResponseData {
  response?: string;
  confidence?: number;
  reasoning?: string;
  actions?: unknown[];
  structured?: StructuredAIResponse;
  fileIssues?: FileIssue[];
  /** Optional: true when the model used vision parts (images) in this reply; UI shows "Image used in this reply". */
  usedVisionParts?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIConversationItemBase {
  id: string;
  type: 'ai';
  content: string;
  timestamp: Date;
  confidence: number;
  structured?: StructuredAIResponse;
  fileIssues?: FileIssue[];
  /** When true, UI shows "Image used in this reply" badge. */
  usedVisionParts?: boolean;
  metadata: {
    reasoning?: string;
    actions: unknown[];
  };
}

export interface AIConversationItemWithLegacy extends AIConversationItemBase {
  aiResponse?: {
    id: string;
    response: string;
    confidence: number;
    reasoning?: string;
    actions: unknown[];
  };
}

const FALLBACK_CONTENT = "I apologize, but I couldn't generate a proper response.";

/**
 * Build an AI conversation item from /api/ai/twin response data.
 * Use this in ai-chat page, AIChatDropdown, and AIChatModule after a successful twin call.
 */
export function buildAIConversationItemFromTwinData(
  data: TwinResponseData,
  options?: { includeLegacyAiResponse?: boolean; id?: string }
): AIConversationItemWithLegacy {
  const id = options?.id ?? `ai_${Date.now()}`;
  const content = data.response?.trim() || FALLBACK_CONTENT;
  const confidence = typeof data.confidence === 'number' ? data.confidence : 0.5;
  const timestamp = new Date();

  const item: AIConversationItemWithLegacy = {
    id,
    type: 'ai',
    content,
    timestamp,
    confidence,
    structured: data.structured,
    fileIssues: Array.isArray(data.fileIssues) ? data.fileIssues : undefined,
    usedVisionParts: data.usedVisionParts === true,
    metadata: {
      reasoning: data.reasoning,
      actions: Array.isArray(data.actions) ? data.actions : [],
      ...(data.metadata ? { twinMetadata: data.metadata } : {}),
    },
  };

  if (options?.includeLegacyAiResponse) {
    item.aiResponse = {
      id: `ai-res-${Date.now()}`,
      response: content,
      confidence,
      reasoning: data.reasoning,
      actions: Array.isArray(data.actions) ? data.actions : [],
    };
  }

  return item;
}

/**
 * Payload for addMessage(conversationId, payload) after a twin response.
 * Includes structured, fileIssues, usedVisionParts so history loads with correct formatting.
 */
export function buildAddMessagePayloadFromTwinData(data: TwinResponseData): {
  role: 'assistant';
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
} {
  const metadata: Record<string, unknown> = {
    reasoning: data.reasoning,
    actions: Array.isArray(data.actions) ? data.actions : [],
  };
  if (data.metadata != null) metadata.twinMetadata = data.metadata;
  if (data.metadata?.continuityState != null) metadata.continuityState = data.metadata.continuityState;
  if (data.metadata?.activeTopic != null) metadata.activeTopic = data.metadata.activeTopic;
  if (data.structured != null) metadata.structured = data.structured;
  if (Array.isArray(data.fileIssues) && data.fileIssues.length > 0) metadata.fileIssues = data.fileIssues;
  if (data.usedVisionParts === true) metadata.usedVisionParts = true;
  return {
    role: 'assistant',
    content: data.response?.trim() || 'No response generated',
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
    metadata,
  };
}

/**
 * Build an AI conversation item for error states (e.g. rate limit, network error).
 * Use in ai-chat page, AIChatDropdown, and AIChatModule when the twin call fails.
 */
export function buildErrorConversationItem(
  message: string,
  options?: { id?: string }
): AIConversationItemBase {
  return {
    id: options?.id ?? `error_${Date.now()}`,
    type: 'ai',
    content: message.trim() || "I apologize, but I encountered an error. Please try again.",
    timestamp: new Date(),
    confidence: 0,
    metadata: { actions: [] },
  };
}
