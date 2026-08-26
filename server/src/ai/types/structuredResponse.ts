/**
 * V2 structured AI response contract for consistent, evidence-backed responses.
 * Types only: no runtime validation or business logic in this file.
 */

export const AI_RESPONSE_VERSION = 'v2';

export type AIResponseMode =
  | 'conversation'
  | 'answer'
  | 'summary'
  | 'analysis'
  | 'recommendation'
  | 'action_plan'
  | 'comparison'
  | 'status_update'
  | 'error';

export type AIConfidenceLevel = 'low' | 'medium' | 'high';

/** Internal-only pacing hint for prompt assembly (not exposed to clients yet). */
export type AIResponseDensity = 'light' | 'balanced' | 'deep';

export interface AIEvidenceItem {
  label: string;
  sourceType?: 'module' | 'file' | 'chat' | 'calendar' | 'drive' | 'business' | 'personal' | 'system' | 'external' | 'unknown';
  sourceId?: string;
  detail?: string;
  /** Optional citation URL for external/web evidence. */
  url?: string;
}

export interface AIRecommendedAction {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  actionType?: 'manual' | 'suggested' | 'automated';
  targetModule?: string;
}

export interface AIStructuredSection {
  title: string;
  content: string;
  bullets?: string[];
}

export interface AIStructuredResponse {
  mode: AIResponseMode;
  summary: string;
  keyInsights?: string[];
  sections?: AIStructuredSection[];
  evidence?: AIEvidenceItem[];
  assumptions?: string[];
  risks?: string[];
  recommendedActions?: AIRecommendedAction[];
  confidence?: {
    level: AIConfidenceLevel;
    explanation?: string;
  };
  style?: {
    tone?: 'clear' | 'professional' | 'concise' | 'operator' | 'supportive' | 'warm';
    format?: 'standard' | 'executive_summary' | 'step_by_step' | 'diagnostic';
  };
  metadata?: {
    usedModules?: string[];
    usedFiles?: string[];
    generatedAt?: string;
    responseVersion?: string;
    responseDensity?: AIResponseDensity;
  };
}

/**
 * Backward-compatible aliases for existing server imports.
 * Legacy response modes are preserved here to avoid broad breakage.
 */
export type StructuredResponseType = AIResponseMode | 'list' | 'steps' | 'actionable' | 'table';

export interface StructuredAIResponseSection {
  heading: string;
  content: string;
  icon?: string;
}

export interface StructuredAITableData {
  columns: string[];
  rows: string[][];
}

export interface StructuredAIActionButton {
  label: string;
  action?: string;
  fileId?: string;
  href?: string;
}

export interface StructuredAIResponse {
  /**
   * Legacy fields retained for compatibility with existing normalization/rendering flow.
   */
  type?: StructuredResponseType;
  title?: string;
  sections?: StructuredAIResponseSection[];
  actions?: StructuredAIActionButton[];
  table?: StructuredAITableData;
  /**
   * V2 fields retained so existing imports can migrate gradually.
   */
  mode?: AIResponseMode;
  summary?: string;
  keyInsights?: string[];
  evidence?: AIEvidenceItem[];
  assumptions?: string[];
  risks?: string[];
  recommendedActions?: AIRecommendedAction[];
  confidence?: {
    level: AIConfidenceLevel;
    explanation?: string;
  };
  style?: {
    tone?: 'clear' | 'professional' | 'concise' | 'operator' | 'supportive' | 'warm';
    format?: 'standard' | 'executive_summary' | 'step_by_step' | 'diagnostic';
  };
  metadata?: {
    usedModules?: string[];
    usedFiles?: string[];
    generatedAt?: string;
    responseVersion?: string;
    responseDensity?: AIResponseDensity;
  };
}
