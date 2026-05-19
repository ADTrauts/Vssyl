import type { SessionSoftPreferenceOverrides } from './preferenceTypes';
import type { ConversationHistoryItem } from '../core/DigitalLifeTwinCore';

const BRIEF_PATTERNS =
  /\b(be\s+)?(brief|short|concise|tl;dr|keep\s+it\s+short|less\s+detail|shorter)\b/i;
const DETAILED_PATTERNS =
  /\b(more\s+detail|in\s+depth|thorough|comprehensive|explain\s+more|elaborate|longer\s+answer)\b/i;
const CASUAL_PATTERNS = /\b(casual|informal|relaxed|friendly|don't\s+be\s+formal)\b/i;
const FORMAL_PATTERNS = /\b(formal|professional|businesslike|proper\s+grammar)\b/i;
const STRUCTURED_PATTERNS = /\b(bullet|bullets|numbered|step\s+by\s+step|outline|structured)\b/i;
const CONVERSATIONAL_PATTERNS = /\b(just\s+chat|conversational|no\s+bullets|don't\s+list)\b/i;
const RICH_REC_PATTERNS = /\b(compare\s+options|pros\s+and\s+cons|tradeoffs|alternatives)\b/i;
const CONCISE_REC_PATTERNS = /\b(one\s+recommendation|pick\s+for\s+me|just\s+tell\s+me\s+what)\b/i;

function scanText(text: string, overrides: SessionSoftPreferenceOverrides): void {
  const t = text.trim();
  if (!t) return;

  if (BRIEF_PATTERNS.test(t)) {
    overrides.verbosity = 'brief';
    overrides.summary = 'brief answers';
  } else if (DETAILED_PATTERNS.test(t)) {
    overrides.verbosity = 'detailed';
    overrides.summary = 'more detailed answers';
  }

  if (CASUAL_PATTERNS.test(t)) {
    overrides.tone = 'casual';
    overrides.summary = overrides.summary ?? 'casual tone';
  } else if (FORMAL_PATTERNS.test(t)) {
    overrides.tone = 'professional';
    overrides.summary = overrides.summary ?? 'professional tone';
  }

  if (STRUCTURED_PATTERNS.test(t)) {
    overrides.structurePreference = 'structured';
    overrides.summary = overrides.summary ?? 'structured replies';
  } else if (CONVERSATIONAL_PATTERNS.test(t)) {
    overrides.structurePreference = 'conversational';
    overrides.summary = overrides.summary ?? 'conversational replies';
  }

  if (RICH_REC_PATTERNS.test(t)) {
    overrides.recommendationRichness = 'rich';
  } else if (CONCISE_REC_PATTERNS.test(t)) {
    overrides.recommendationRichness = 'concise';
  }
}

/**
 * Detect ephemeral style adjustments from the current message and recent user turns.
 * Session overrides apply for this request only until promoted to the profile.
 */
export function detectSessionSoftPreferenceOverrides(
  currentQuery: string,
  conversationHistory?: ConversationHistoryItem[]
): SessionSoftPreferenceOverrides | null {
  const overrides: SessionSoftPreferenceOverrides = {};

  scanText(currentQuery, overrides);

  if (Object.keys(overrides).length === 0 && conversationHistory?.length) {
    const recentUser = conversationHistory
      .filter((m) => m.role === 'user')
      .slice(-3)
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .reverse();
    for (const msg of recentUser) {
      scanText(msg, overrides);
      if (Object.keys(overrides).length > 0) break;
    }
  }

  const keys = Object.keys(overrides).filter((k) => k !== 'summary');
  if (keys.length === 0) return null;

  if (!overrides.summary) {
    overrides.summary = keys.join(', ');
  }

  return overrides;
}
