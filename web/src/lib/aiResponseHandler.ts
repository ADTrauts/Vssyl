/**
 * Central handler for AI twin API response → conversation item.
 * Single place for defaults and shape so ai-chat page, AIChatDropdown, and AIChatModule stay in sync.
 */

import type { StructuredAIResponse } from '../components/ai/AIResponseRenderer';
import {
  extractResponseInfluenceFromTwinMetadata,
  type ResponseInfluenceSummary,
} from '../api/aiResponseInfluence';

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
  /** Per-turn explainability from twin metadata.responseInfluence. */
  responseInfluence?: ResponseInfluenceSummary;
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

const STRUCTURED_STREAM_KEYS = [
  '"mode"',
  '"summary"',
  '"sections"',
  '"keyInsights"',
  '"evidence"',
  '"recommendedActions"',
  '"confidence"',
  '"metadata"',
  '"responseVersion"',
];

const STRUCTURED_AI_MODES = new Set([
  'conversation',
  'answer',
  'summary',
  'analysis',
  'recommendation',
  'action_plan',
  'comparison',
  'status_update',
  'error',
  'list',
  'steps',
  'actionable',
  'table',
]);

export function isLikelyStructuredJSONStream(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const startsLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (!startsLikeJson) return false;
  const keyHits = STRUCTURED_STREAM_KEYS.filter((k) => trimmed.includes(k)).length;
  return keyHits >= 2;
}

function stripJsonArtifacts(text: string): string {
  return text
    .replace(/^\s*[\{\[]+/, '')
    .replace(/[\}\]]+\s*$/, '')
    .replace(/"\w+"\s*:\s*/g, '')
    .replace(/,\s*"/g, '\n')
    .trim();
}

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    if (inner.startsWith('{') || inner.startsWith('[')) return inner;
  }
  return trimmed;
}

/**
 * True when a parsed object matches the platform structured AI response contract.
 * Avoids swallowing arbitrary JSON the model may intentionally show as code/data.
 */
export function isStructuredAIResponseObject(obj: unknown): obj is StructuredAIResponse {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  const summary = typeof o.summary === 'string' ? o.summary.trim() : '';
  if (!summary) return false;

  const mode = typeof o.mode === 'string' ? o.mode.trim().toLowerCase() : '';
  if (mode && STRUCTURED_AI_MODES.has(mode)) return true;

  const meta = o.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const version = (meta as Record<string, unknown>).responseVersion;
    if (version === 'v2') return true;
  }

  return false;
}

/**
 * Parse a string that may be raw structured AI JSON (optionally fenced).
 */
export function tryParseStructuredAIJSON(text: string): StructuredAIResponse | null {
  const candidate = extractJsonCandidate(text);
  if (!isLikelyStructuredJSONStream(candidate)) return null;
  try {
    const parsed: unknown = JSON.parse(candidate);
    if (isStructuredAIResponseObject(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function proseFromStructured(structured: StructuredAIResponse, fallbackRaw: string): string {
  const summary = structured.summary?.trim();
  if (summary) return summary;
  return buildSafeStreamFallbackContent(fallbackRaw);
}

/**
 * Normalize twin API payloads so UI never shows raw structured JSON in bubbles.
 */
export function normalizeTwinResponseData(data: TwinResponseData): TwinResponseData {
  let structured = data.structured;
  let response = (data.response ?? '').trim();

  const topLevel = data as Record<string, unknown>;
  if (!structured && isStructuredAIResponseObject(topLevel)) {
    structured = topLevel as unknown as StructuredAIResponse;
  }

  if (!structured && response) {
    const parsed = tryParseStructuredAIJSON(response);
    if (parsed) structured = parsed;
  }

  if (structured && response && isLikelyStructuredJSONStream(response)) {
    const parsedFromResponse = tryParseStructuredAIJSON(response);
    if (parsedFromResponse) {
      structured = { ...parsedFromResponse, ...structured, summary: structured.summary || parsedFromResponse.summary };
    }
  }

  if (structured) {
    const prose = proseFromStructured(structured, response);
    if (!response || isLikelyStructuredJSONStream(response) || response === JSON.stringify(structured)) {
      response = prose;
    } else if (structured.summary?.trim() && response.startsWith('{')) {
      response = prose;
    }
  } else if (response && isLikelyStructuredJSONStream(response)) {
    response = buildSafeStreamFallbackContent(response);
  }

  return {
    ...data,
    response: response || FALLBACK_CONTENT,
    structured,
  };
}

/**
 * Normalize persisted assistant messages (content + metadata.structured).
 */
export function normalizeStoredAIMessage(input: {
  content: string;
  structured?: StructuredAIResponse;
}): { content: string; structured?: StructuredAIResponse } {
  const normalized = normalizeTwinResponseData({
    response: input.content,
    structured: input.structured,
  });
  return {
    content: normalized.response?.trim() || FALLBACK_CONTENT,
    structured: normalized.structured,
  };
}

/**
 * Resolve display fields at render time (safety net for legacy rows in memory/DB).
 */
export function resolveAIDisplayFields(item: {
  content: string;
  structured?: StructuredAIResponse;
}): { content: string; structured?: StructuredAIResponse } {
  return normalizeStoredAIMessage(item);
}

/**
 * Never return raw JSON to the user. Try to extract useful text from a structured
 * payload; otherwise return a generic fallback.
 */
export function buildSafeStreamFallbackContent(rawStreamText: string): string {
  const trimmed = rawStreamText.trim();
  if (!trimmed) return FALLBACK_CONTENT;

  const parsed = tryParseStructuredAIJSON(trimmed);
  if (parsed) return proseFromStructured(parsed, trimmed);

  if (isLikelyStructuredJSONStream(trimmed)) {
    try {
      const loose = JSON.parse(extractJsonCandidate(trimmed)) as Record<string, unknown>;
      if (typeof loose.summary === 'string' && loose.summary.trim()) return loose.summary.trim();
      if (typeof loose.response === 'string' && loose.response.trim()) return loose.response.trim();
      if (Array.isArray(loose.sections) && loose.sections.length > 0) {
        const first = loose.sections[0] as Record<string, unknown>;
        if (typeof first.content === 'string' && first.content.trim()) return first.content.trim();
      }
      const stripped = stripJsonArtifacts(trimmed);
      return stripped && !stripped.startsWith('"') ? stripped : "I couldn't format that response cleanly. Please try again.";
    } catch {
      return "I couldn't format that response cleanly. Please try again.";
    }
  }

  return trimmed;
}

/**
 * Build an AI conversation item from /api/ai/twin response data.
 * Use this in ai-chat page, AIChatDropdown, and AIChatModule after a successful twin call.
 */
export function buildAIConversationItemFromTwinData(
  data: TwinResponseData,
  options?: { includeLegacyAiResponse?: boolean; id?: string }
): AIConversationItemWithLegacy {
  const normalized = normalizeTwinResponseData(data);
  const id = options?.id ?? `ai_${Date.now()}`;
  const content = normalized.response?.trim() || FALLBACK_CONTENT;
  const confidence = typeof normalized.confidence === 'number' ? normalized.confidence : 0.5;
  const timestamp = new Date();

  const responseInfluence = extractResponseInfluenceFromTwinMetadata(normalized.metadata);

  const item: AIConversationItemWithLegacy = {
    id,
    type: 'ai',
    content,
    timestamp,
    confidence,
    structured: normalized.structured,
    fileIssues: Array.isArray(normalized.fileIssues) ? normalized.fileIssues : undefined,
    usedVisionParts: normalized.usedVisionParts === true,
    responseInfluence: responseInfluence ?? undefined,
    metadata: {
      reasoning: normalized.reasoning,
      actions: Array.isArray(normalized.actions) ? normalized.actions : [],
      ...(normalized.metadata ? { twinMetadata: normalized.metadata } : {}),
    },
  };

  if (options?.includeLegacyAiResponse) {
    item.aiResponse = {
      id: `ai-res-${Date.now()}`,
      response: content,
      confidence,
      reasoning: normalized.reasoning,
      actions: Array.isArray(normalized.actions) ? normalized.actions : [],
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
  const normalized = normalizeTwinResponseData(data);
  const metadata: Record<string, unknown> = {
    reasoning: normalized.reasoning,
    actions: Array.isArray(normalized.actions) ? normalized.actions : [],
  };
  if (normalized.metadata != null) metadata.twinMetadata = normalized.metadata;
  if (normalized.metadata?.continuityState != null) metadata.continuityState = normalized.metadata.continuityState;
  if (normalized.metadata?.activeTopic != null) metadata.activeTopic = normalized.metadata.activeTopic;
  if (normalized.metadata?.responseInfluence != null) {
    metadata.responseInfluence = normalized.metadata.responseInfluence;
  }
  if (normalized.structured != null) metadata.structured = normalized.structured;
  if (Array.isArray(normalized.fileIssues) && normalized.fileIssues.length > 0) metadata.fileIssues = normalized.fileIssues;
  if (normalized.usedVisionParts === true) metadata.usedVisionParts = true;
  return {
    role: 'assistant',
    content: normalized.response?.trim() || 'No response generated',
    confidence: typeof normalized.confidence === 'number' ? normalized.confidence : 0.5,
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
