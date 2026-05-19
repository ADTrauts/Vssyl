/**
 * Effective AI preference model (Phase 0A).
 * Hard controls always override soft and inferred preferences.
 */

export type PreferenceProvenance = 'user' | 'questionnaire' | 'inferred' | 'session' | 'default';

export type SoftTone = 'casual' | 'professional' | 'warm' | 'adaptive';
export type SoftVerbosity = 'brief' | 'balanced' | 'detailed';
export type SoftRecommendationRichness = 'concise' | 'balanced' | 'rich';
export type SoftStructurePreference = 'conversational' | 'structured' | 'analytical';

export interface EffectiveHardControls {
  preferredProvider: 'auto' | 'openai' | 'anthropic';
  preferredModelOpenai: string | null;
  preferredModelAnthropic: string | null;
  autonomyModules: {
    scheduling: number;
    communication: number;
    fileManagement: number;
    taskCreation: number;
    dataAnalysis: number;
    crossModuleActions: number;
  };
  financialThreshold: number;
  timeCommitmentThreshold: number;
  peopleAffectedThreshold: number;
  timeBoundaries?: {
    workHours?: { enabled: boolean; start: string; end: string };
    familyTime?: { enabled: boolean; start: string; end: string };
    sleepHours?: { enabled: boolean; start: string; end: string };
  };
}

export interface EffectiveSoftPreferences {
  tone: SoftTone;
  verbosity: SoftVerbosity;
  recommendationRichness: SoftRecommendationRichness;
  structurePreference: SoftStructurePreference;
  communicationStyle: string;
}

export interface EffectiveInferredPreference {
  id: string;
  kind: 'context' | 'memory_fact';
  label: string;
  value: string;
  confidence: number;
}

export interface EffectivePreferencesProvenance {
  hard: Record<string, PreferenceProvenance>;
  soft: Record<string, PreferenceProvenance>;
}

/** Compact block for AIContextAssembler (prompt-safe, no raw questionnaire). */
export interface EffectivePreferencesContextBlock {
  communication: {
    tone: SoftTone;
    verbosity: SoftVerbosity;
    styleNotes: string;
  };
  response: {
    structure: SoftStructurePreference;
    recommendationRichness: SoftRecommendationRichness;
  };
  boundaries: string[];
  inferredHints?: string[];
}

/** Provider system-prompt payloads (bounded). */
export interface EffectivePreferencesProviderPayload {
  personality: Record<string, unknown>;
  autonomyBoundaries: Record<string, unknown>;
  /** Human-readable instructions derived from questionnaire + soft prefs (not raw JSON). */
  softPromptInstructions: string;
}

/** Partial soft overrides detected from the current thread (session-only until promoted). */
export interface SessionSoftPreferenceOverrides {
  tone?: SoftTone;
  verbosity?: SoftVerbosity;
  recommendationRichness?: SoftRecommendationRichness;
  structurePreference?: SoftStructurePreference;
  /** Short label for UI, e.g. "brief answers" */
  summary?: string;
}

export interface ResolvedEffectivePreferences {
  hard: EffectiveHardControls;
  soft: EffectiveSoftPreferences;
  inferred: EffectiveInferredPreference[];
  provenance: EffectivePreferencesProvenance;
  contextBlock: EffectivePreferencesContextBlock;
  providerPayload: EffectivePreferencesProviderPayload;
}
