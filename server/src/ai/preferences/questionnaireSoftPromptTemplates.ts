import type {
  EffectiveSoftPreferences,
  SoftRecommendationRichness,
  SoftStructurePreference,
  SoftTone,
  SoftVerbosity,
} from './preferenceTypes';

export interface QuestionnairePromptDetail {
  formality?: string;
  responseSpeed?: string;
  conflictStyle?: string;
  informationNeeds?: string;
  consultationStyle?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Extract questionnaire text fields for richer templates (prompt-safe, bounded). */
export function extractQuestionnairePromptDetail(
  personalityData: unknown
): QuestionnairePromptDetail | undefined {
  if (!isRecord(personalityData)) return undefined;
  const prefs = isRecord(personalityData.preferences) ? personalityData.preferences : {};
  const comm = isRecord(prefs.communication) ? prefs.communication : {};
  const decision = isRecord(prefs.decision) ? prefs.decision : {};
  const detail: QuestionnairePromptDetail = {};
  if (typeof comm.formality === 'string' && comm.formality.trim()) {
    detail.formality = comm.formality.trim().slice(0, 120);
  }
  if (typeof comm.responseSpeed === 'string' && comm.responseSpeed.trim()) {
    detail.responseSpeed = comm.responseSpeed.trim().slice(0, 120);
  }
  if (typeof comm.conflictStyle === 'string' && comm.conflictStyle.trim()) {
    detail.conflictStyle = comm.conflictStyle.trim().slice(0, 120);
  }
  if (typeof decision.informationNeeds === 'string' && decision.informationNeeds.trim()) {
    detail.informationNeeds = decision.informationNeeds.trim().slice(0, 80);
  }
  if (typeof decision.consultationStyle === 'string' && decision.consultationStyle.trim()) {
    detail.consultationStyle = decision.consultationStyle.trim().slice(0, 80);
  }
  return Object.keys(detail).length > 0 ? detail : undefined;
}

function toneInstruction(tone: SoftTone, formality?: string): string {
  switch (tone) {
    case 'casual':
      return 'Use a relaxed, conversational tone — contractions and plain language are fine.';
    case 'professional':
      return 'Use a clear, professional tone — polished but not stiff or overly formal.';
    case 'warm':
      return 'Be warm and approachable while staying respectful and helpful.';
    default:
      if (formality?.toLowerCase().includes('formal')) {
        return 'Match a more formal register when the topic warrants it; otherwise stay clear and direct.';
      }
      if (formality?.toLowerCase().includes('casual')) {
        return 'Default to an informal, friendly register unless the topic is sensitive.';
      }
      return 'Adapt tone to the situation; mirror the user’s level of formality.';
  }
}

function verbosityInstruction(verbosity: SoftVerbosity, informationNeeds?: string): string {
  if (verbosity === 'brief') {
    return 'Keep answers concise: lead with the answer, then only essential context.';
  }
  if (verbosity === 'detailed') {
    return 'Provide thorough explanations with useful context, examples, and tradeoffs when relevant.';
  }
  if (informationNeeds?.toLowerCase().includes('comprehensive')) {
    return 'Balance clarity with depth; expand when the question benefits from analysis.';
  }
  if (informationNeeds?.toLowerCase().includes('minimal')) {
    return 'Prefer short, actionable answers unless the user asks for more.';
  }
  return 'Use balanced length — enough detail to be useful without rambling.';
}

function structureInstruction(structure: SoftStructurePreference): string {
  switch (structure) {
    case 'analytical':
      return 'Structure replies with clear reasoning: context, analysis, then conclusion or recommendation.';
    case 'conversational':
      return 'Favor natural flow over heavy formatting; use lists only when they aid scanning.';
    default:
      return 'Use headings or bullet lists when organizing multi-part answers.';
  }
}

function richnessInstruction(richness: SoftRecommendationRichness): string {
  switch (richness) {
    case 'concise':
      return 'When recommending, prefer one strong option plus at most one alternative, then a clarifying question.';
    case 'rich':
      return 'When recommending, compare options with tradeoffs and experiential cues when helpful.';
    default:
      return 'When recommending, compare options briefly when multiple paths are viable.';
  }
}

/**
 * Map resolved soft preferences (+ optional questionnaire detail) to prompt-safe prose.
 */
export function buildQuestionnaireSoftPromptInstructions(
  soft: EffectiveSoftPreferences,
  detail?: QuestionnairePromptDetail
): string {
  const lines: string[] = [
    toneInstruction(soft.tone, detail?.formality),
    verbosityInstruction(soft.verbosity, detail?.informationNeeds),
    structureInstruction(soft.structurePreference),
    richnessInstruction(soft.recommendationRichness),
  ];

  if (detail?.responseSpeed) {
    lines.push(`Response pace preference: ${detail.responseSpeed.slice(0, 100)}.`);
  }
  if (detail?.conflictStyle) {
    lines.push(`When navigating disagreement: ${detail.conflictStyle.slice(0, 100)}.`);
  }
  if (detail?.consultationStyle) {
    lines.push(`Decision style: ${detail.consultationStyle.slice(0, 80)}.`);
  }

  const styleNotes = soft.communicationStyle?.trim();
  if (styleNotes && styleNotes !== 'adapt to context') {
    lines.push(`Additional style notes: ${styleNotes.slice(0, 180)}.`);
  }

  return lines.join('\n');
}
