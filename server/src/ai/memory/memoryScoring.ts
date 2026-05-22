/**
 * Scoring helpers for UserMemoryFact retrieval (Phase 1C).
 */

/** ~30-day half-life for recency decay. */
export const DEFAULT_RECENCY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;

/** Align with AIContextAssembler per-fact predicate truncate. */
export const MEMORY_PREDICATE_CHAR_BUDGET = 600;

/** Minimum confidence for inferred (non-explicit) facts in prompts. */
export const MEMORY_INFERRED_CONFIDENCE_FLOOR = 0.55;

/** User-pinned facts use this confidence for retrieval priority (no schema flag). */
export const MEMORY_PINNED_CONFIDENCE = 0.95;

export function recencyWeight(
  updatedAt: Date,
  now: Date = new Date(),
  halfLifeMs: number = DEFAULT_RECENCY_HALF_LIFE_MS
): number {
  const ageMs = Math.max(0, now.getTime() - updatedAt.getTime());
  return Math.pow(0.5, ageMs / halfLifeMs);
}

export function tokenizeForRelevance(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

/** 0–1 overlap between query tokens and fact text. */
export function lexicalRelevanceScore(
  query: string,
  subject: string,
  predicate: string
): number {
  const tokens = tokenizeForRelevance(query);
  if (tokens.length === 0) return 0;

  const blob = `${subject} ${predicate}`.toLowerCase();
  let matches = 0;
  for (const t of tokens) {
    if (blob.includes(t)) matches += 1;
  }
  return Math.min(1, matches / tokens.length);
}

/** Personal facts always match personal context; business facts match when businessId aligns. */
export function scopeMatchWeight(
  factScope: string,
  factBusinessId: string | null | undefined,
  contextBusinessId?: string
): number {
  if (!contextBusinessId) {
    return factScope === 'personal' ? 1 : 0.35;
  }
  if (factScope === 'personal') return 0.95;
  if (factScope === 'business' && factBusinessId === contextBusinessId) return 1;
  return 0;
}

export function combinedMemoryScore(input: {
  confidence: number;
  updatedAt: Date;
  query: string;
  subject: string;
  predicate: string;
  isExplicit: boolean;
  factScope: string;
  factBusinessId?: string | null;
  contextBusinessId?: string;
  isRecallQuery: boolean;
  now?: Date;
}): number {
  const scopeW = scopeMatchWeight(
    input.factScope,
    input.factBusinessId,
    input.contextBusinessId
  );
  if (scopeW <= 0) return 0;

  const lexical = lexicalRelevanceScore(input.query, input.subject, input.predicate);
  const lexicalComponent = input.isRecallQuery
    ? Math.max(lexical, 0.45)
    : 0.2 + 0.8 * lexical;

  const recency = recencyWeight(input.updatedAt, input.now);
  const explicitBoost = input.isExplicit ? 1.05 : 1;

  return input.confidence * recency * lexicalComponent * scopeW * explicitBoost;
}
