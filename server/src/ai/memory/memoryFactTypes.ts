/**
 * User memory fact provenance and category types (Phase 1B).
 * Distinct from freeform UserAIContext — see memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md § fact types.
 */

export const MEMORY_FACT_SOURCE_TYPES = [
  'explicit_user',
  'remember_that',
  'inferred_chat',
  'questionnaire',
  'import',
] as const;

export type MemoryFactSourceType = (typeof MEMORY_FACT_SOURCE_TYPES)[number];

export const MEMORY_FACT_CATEGORIES = [
  'preference',
  'person',
  'project',
  'constraint',
  'location',
  'other',
] as const;

export type MemoryFactCategory = (typeof MEMORY_FACT_CATEGORIES)[number];

const DEFAULT_CONFIDENCE_BY_SOURCE: Record<MemoryFactSourceType, number> = {
  explicit_user: 0.8,
  remember_that: 0.85,
  inferred_chat: 0.65,
  questionnaire: 0.9,
  import: 0.75,
};

export function isMemoryFactSourceType(value: string): value is MemoryFactSourceType {
  return (MEMORY_FACT_SOURCE_TYPES as readonly string[]).includes(value);
}

export function isMemoryFactCategory(value: string): value is MemoryFactCategory {
  return (MEMORY_FACT_CATEGORIES as readonly string[]).includes(value);
}

export function defaultConfidenceForSourceType(sourceType: MemoryFactSourceType): number {
  return DEFAULT_CONFIDENCE_BY_SOURCE[sourceType];
}

export function isExplicitSourceType(sourceType: MemoryFactSourceType): boolean {
  return sourceType === 'explicit_user' || sourceType === 'remember_that' || sourceType === 'questionnaire';
}

/** Lightweight category guess from subject + predicate text. */
export function inferMemoryFactCategory(subject: string, predicate: string): MemoryFactCategory {
  const blob = `${subject} ${predicate}`.toLowerCase();

  if (/\b(prefers?|likes|dislikes|always|never|favorite|favourite)\b/.test(blob)) {
    return 'preference';
  }
  if (/\b(my (wife|husband|partner|boss|manager|team|client)|named|called)\b/.test(blob)) {
    return 'person';
  }
  if (/\b(project|deadline|launch|sprint|initiative|roadmap)\b/.test(blob)) {
    return 'project';
  }
  if (/\b(must|cannot|can't|don't|avoid|only|never|always|deadline|by friday)\b/.test(blob)) {
    return 'constraint';
  }
  if (/\b(live in|located|office|city|travel|trip|vacation|address)\b/.test(blob)) {
    return 'location';
  }

  return 'other';
}

export function memorySourceTypeUserLabel(sourceType: MemoryFactSourceType): string {
  switch (sourceType) {
    case 'explicit_user':
      return 'You added this';
    case 'remember_that':
      return 'From “remember that…” in chat';
    case 'inferred_chat':
      return 'Inferred from chat';
    case 'questionnaire':
      return 'From your profile';
    case 'import':
      return 'Imported';
    default:
      return 'Knowledge';
  }
}

export function memoryCategoryUserLabel(category: MemoryFactCategory): string {
  switch (category) {
    case 'preference':
      return 'Preference';
    case 'person':
      return 'Person';
    case 'project':
      return 'Project';
    case 'constraint':
      return 'Constraint';
    case 'location':
      return 'Location';
    default:
      return 'General';
  }
}

/**
 * When to use UserMemoryFact vs UserAIContext (preference type):
 * - UserMemoryFact: atomic, subject+predicate facts with provenance (trip style, names, constraints).
 * - UserAIContext (preference): longer freeform instructions or promoted learning blobs.
 */
export const MEMORY_VS_CONTEXT_GUIDANCE =
  'Use UserMemoryFact for discrete rememberable facts; use UserAIContext for instructions and promoted preferences.';
