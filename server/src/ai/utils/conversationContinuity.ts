import type { ConversationHistoryItem } from '../core/DigitalLifeTwinCore';

export interface ConversationContinuityState {
  currentTopic?: string;
  activeEntities?: string[];
  userGoal?: string;
  emotionalTone?: string;
  unresolvedQuestions?: string[];
  conversationMomentum?: string;
  lastUpdatedAt: string;
}

export interface ActiveTopicState {
  label: string;
  entities: string[];
  userGoal?: string;
  confidence: number;
  updatedAt: string;
}

const QUESTION_WORDS = /\b(which|what|why|how|should|can|could|would)\b/i;
const COMPARISON_WORDS = /\b(vs|versus|or|compare|which one|better)\b/i;
const PRONOUN_CONTINUATION = /\b(it|that|those|they|which one|this)\b/i;
const EMOTIONAL_TONE = [
  { tone: 'stressed', re: /\b(stressed|overwhelmed|burned out)\b/i },
  { tone: 'positive', re: /\b(excited|happy|great)\b/i },
  { tone: 'uncertain', re: /\b(not sure|unsure|conflicted|torn)\b/i },
] as const;

function extractEntities(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  const unique = Array.from(new Set(matches.map((m) => m.trim())));
  return unique.slice(0, 8);
}

function inferGoal(text: string): string | undefined {
  if (/\bdecide|choose|pick\b/i.test(text)) return 'make a decision';
  if (/\bplan|next step|roadmap\b/i.test(text)) return 'create a plan';
  if (/\brelax|decompress|reset\b/i.test(text)) return 'optimize for relaxation';
  return undefined;
}

function inferTone(text: string): string | undefined {
  for (const candidate of EMOTIONAL_TONE) {
    if (candidate.re.test(text)) return candidate.tone;
  }
  return undefined;
}

export function classifyTopicTransition(input: {
  latestUserMessage: string;
  previousTopic?: ActiveTopicState;
}): 'continuation' | 'shift' | 'ambiguous' {
  const { latestUserMessage, previousTopic } = input;
  if (!previousTopic) return 'shift';
  const text = latestUserMessage.toLowerCase();
  if (PRONOUN_CONTINUATION.test(text) || COMPARISON_WORDS.test(text)) return 'continuation';
  if (previousTopic.entities.some((e) => text.includes(e.toLowerCase()))) return 'continuation';
  if (QUESTION_WORDS.test(text) && text.split(/\s+/).length < 8) return 'ambiguous';
  return 'shift';
}

export function updateConversationContinuityState(input: {
  latestUserMessage: string;
  recentMessages: ConversationHistoryItem[];
  previousState?: ConversationContinuityState;
  previousTopic?: ActiveTopicState;
}): { continuity: ConversationContinuityState; activeTopic: ActiveTopicState } {
  const latest = input.latestUserMessage.trim();
  const entities = extractEntities(latest);
  const transition = classifyTopicTransition({
    latestUserMessage: latest,
    previousTopic: input.previousTopic,
  });
  const now = new Date().toISOString();

  const previousEntities = input.previousState?.activeEntities ?? [];
  const mergedEntities =
    transition === 'continuation'
      ? Array.from(new Set([...previousEntities, ...entities])).slice(0, 10)
      : entities;

  const unresolved = QUESTION_WORDS.test(latest)
    ? [latest].slice(0, 4)
    : (input.previousState?.unresolvedQuestions ?? []).slice(0, 3);

  const continuity: ConversationContinuityState = {
    currentTopic:
      transition === 'continuation'
        ? input.previousState?.currentTopic || input.previousTopic?.label
        : latest.slice(0, 80),
    activeEntities: mergedEntities,
    userGoal: inferGoal(latest) || input.previousState?.userGoal,
    emotionalTone: inferTone(latest) || input.previousState?.emotionalTone,
    unresolvedQuestions: unresolved,
    conversationMomentum:
      transition === 'continuation'
        ? 'continuing existing thread'
        : transition === 'ambiguous'
          ? 'possible continuation'
          : 'new topic',
    lastUpdatedAt: now,
  };

  const activeTopic: ActiveTopicState = {
    label: continuity.currentTopic || latest.slice(0, 80),
    entities: mergedEntities.slice(0, 8),
    userGoal: continuity.userGoal,
    confidence: transition === 'continuation' ? 0.85 : transition === 'ambiguous' ? 0.55 : 0.75,
    updatedAt: now,
  };

  void input.recentMessages;
  return { continuity, activeTopic };
}
