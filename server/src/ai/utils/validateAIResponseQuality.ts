/**
 * Lightweight quality guardrails for normalized AI responses (additive; never blocks).
 */

import type { StructuredAIResponse } from '../types/structuredResponse';

export interface AIResponseQualityResult {
  warnings: string[];
  adjustedConfidence?: number;
}

function hasRecommendedActions(s: StructuredAIResponse): boolean {
  return Array.isArray(s.recommendedActions) && s.recommendedActions.length > 0;
}

function hasStructuredRisks(s: StructuredAIResponse): boolean {
  return Array.isArray(s.risks) && s.risks.length > 0;
}

function hasStructuredConfidence(s: StructuredAIResponse): boolean {
  const c = s.confidence;
  return !!(c && typeof c === 'object' && typeof c.level === 'string' && c.level.length > 0);
}

function isConversationMode(structured?: StructuredAIResponse): boolean {
  return structured?.mode === 'conversation';
}

/**
 * Inspect structured output vs assembled context for trust/debug signals.
 * Does not mutate payloads; may suggest a slightly lower numeric confidence when warnings fire.
 */
export function validateAIResponseQuality(input: {
  structured?: StructuredAIResponse;
  response: string;
  assembledContext?: {
    evidence?: unknown[];
    missingContext?: string[];
    risks?: string[];
    structuredResponseMode?: string;
  };
  currentConfidence: number;
}): AIResponseQualityResult {
  const warnings: string[] = [];
  const { structured, assembledContext, currentConfidence } = input;
  void input.response;

  const conversation =
    isConversationMode(structured) ||
    assembledContext?.structuredResponseMode === 'conversation';

  if (!structured || typeof structured !== 'object') {
    warnings.push('NO_STRUCTURED_RESPONSE');
  } else if (conversation) {
    if (!structured.summary?.trim()) {
      warnings.push('CONVERSATION_MISSING_SUMMARY');
    }
  } else {
    const structEvidenceLen = Array.isArray(structured.evidence) ? structured.evidence.length : 0;
    const acEvidenceLen = Array.isArray(assembledContext?.evidence) ? assembledContext.evidence.length : 0;

    if (acEvidenceLen > 0 && structEvidenceLen === 0) {
      warnings.push('MISSING_EVIDENCE');
    }

    if (hasRecommendedActions(structured) && structEvidenceLen === 0) {
      warnings.push('UNSUPPORTED_ACTIONS');
    }

    const missingCtx = Array.isArray(assembledContext?.missingContext) ? assembledContext.missingContext : [];
    if (missingCtx.length > 0 && !hasStructuredRisks(structured)) {
      warnings.push('MISSING_CONTEXT_NOT_DISCLOSED');
    }

    if (!hasStructuredConfidence(structured)) {
      warnings.push('MISSING_STRUCTURED_CONFIDENCE');
    }
  }

  if (!conversation) {
    const structuredEvidenceEmpty =
      !structured ||
      typeof structured !== 'object' ||
      !Array.isArray(structured.evidence) ||
      structured.evidence.length === 0;
    const assembledEvidenceEmpty =
      !assembledContext?.evidence ||
      !Array.isArray(assembledContext.evidence) ||
      assembledContext.evidence.length === 0;
    if (
      currentConfidence >= 0.85 &&
      structuredEvidenceEmpty &&
      assembledEvidenceEmpty
    ) {
      warnings.push('HIGH_CONFIDENCE_WITHOUT_EVIDENCE');
    }
  }

  let adjustedConfidence: number | undefined;
  if (warnings.length > 0 && !conversation) {
    const penalized = currentConfidence - 0.03 * warnings.length;
    adjustedConfidence = Math.max(0.4, penalized);
  }

  return { warnings, adjustedConfidence };
}
