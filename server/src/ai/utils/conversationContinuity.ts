import type { ConversationHistoryItem } from '../core/DigitalLifeTwinCore';

export interface ConversationContinuityState {
  currentTopic?: string;
  activeEntities?: string[];
  userGoal?: string;
  emotionalTone?: string;
  unresolvedQuestions?: string[];
  conversationMomentum?: string;
  /** User-stated constraints accumulated across the thread (e.g. "domestic only"). */
  narrowingConstraints?: string[];
  /** Short summary of what the assistant last suggested (for follow-up turns). */
  lastAssistantTurnSummary?: string;
  lastUpdatedAt: string;
}

export interface ActiveTopicState {
  label: string;
  entities: string[];
  userGoal?: string;
  confidence: number;
  updatedAt: string;
  /** Broad domain when detectable (travel, work, planning, …). */
  domain?: string;
}

export interface ConversationThreadHints {
  threadSummary: string;
  activeTopicLabel: string;
  momentum: 'continue' | 'new_topic' | 'ambiguous';
  narrowingConstraints: string[];
  lastUserMessages: string[];
  lastAssistantMessage?: string;
  priorPlaceSuggestions: string[];
  isFollowUp: boolean;
}

const QUESTION_WORDS = /\b(which|what|why|how|should|can|could|would)\b/i;
const COMPARISON_WORDS = /\b(vs|versus|or|compare|which one|better)\b/i;
const PRONOUN_CONTINUATION = /\b(it|that|those|they|which one|this|these|there)\b/i;
const REFINEMENT_SIGNALS =
  /\b(instead|rather|how about|what about|actually|more like|limit to|stick to|only|within|domestic|international|non-?international|in the (us|u\.s\.|united states)|warm weather|good food|cheaper|affordable|last minute)\b/i;
const TRAVEL_DOMAIN = /\b(vacation|trip|travel|getaway|destination|flight|beach|city break|weekend)\b/i;
const SHORT_FOLLOWUP_MAX_WORDS = 14;

const EMOTIONAL_TONE = [
  { tone: 'stressed', re: /\b(stressed|overwhelmed|burned out)\b/i },
  { tone: 'positive', re: /\b(excited|happy|great)\b/i },
  { tone: 'uncertain', re: /\b(not sure|unsure|conflicted|torn)\b/i },
] as const;

const CONSTRAINT_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'domestic / US only', re: /\b(domestic|non-?international|within the (us|u\.s\.|united states)|in the us|stateside)\b/i },
  { label: 'international', re: /\b(international|abroad|overseas)\b/i },
  { label: 'warm weather', re: /\b(warm weather|warm|sunny|tropical)\b/i },
  { label: 'good food', re: /\b(good food|food scene|great restaurants|culinary)\b/i },
  { label: 'affordable / budget', re: /\b(affordable|cheap|budget|low cost|most affordable)\b/i },
  { label: 'last minute', re: /\b(last minute|last-minute|soon|this week)\b/i },
  { label: 'beach', re: /\b(beach|coast|ocean)\b/i },
  { label: 'city', re: /\b(city|urban|downtown)\b/i },
  { label: 'quiet / reset', re: /\b(quiet|reset|relax|low key|secluded)\b/i },
];

function extractEntities(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?\b/g) ?? [];
  const unique = Array.from(new Set(matches.map((m) => m.trim())));
  return unique.slice(0, 10);
}

function extractPlaceSuggestions(text: string): string[] {
  const entities = extractEntities(text);
  const stop = new Set(['User', 'Assistant', 'The', 'If', 'For', 'And', 'But', 'Not']);
  return entities.filter((e) => !stop.has(e.split(' ')[0])).slice(0, 12);
}

function inferGoal(text: string): string | undefined {
  if (/\bdecide|choose|pick|figure out where\b/i.test(text)) return 'make a decision';
  if (/\bplan|next step|roadmap\b/i.test(text)) return 'create a plan';
  if (/\brelax|decompress|reset|getaway\b/i.test(text)) return 'optimize for relaxation';
  if (TRAVEL_DOMAIN.test(text)) return 'plan a trip';
  return undefined;
}

function inferTone(text: string): string | undefined {
  for (const candidate of EMOTIONAL_TONE) {
    if (candidate.re.test(text)) return candidate.tone;
  }
  return undefined;
}

function inferDomain(text: string): string | undefined {
  if (TRAVEL_DOMAIN.test(text)) return 'travel';
  if (/\b(hiring|employee|compliance|revenue|metrics|churn)\b/i.test(text)) return 'business';
  return undefined;
}

function extractConstraintsFromText(text: string): string[] {
  const found: string[] = [];
  for (const { label, re } of CONSTRAINT_PATTERNS) {
    if (re.test(text)) found.push(label);
  }
  return found;
}

function collectThreadConstraints(messages: ConversationHistoryItem[], latest: string): string[] {
  const userTexts = [
    ...messages.filter((m) => m.role === 'user').map((m) => (m.content || '').trim()),
    latest.trim(),
  ].filter(Boolean);
  const all = new Set<string>();
  for (const t of userTexts) {
    for (const c of extractConstraintsFromText(t)) all.add(c);
  }
  return [...all];
}

function lastAssistantContent(messages: ConversationHistoryItem[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && (m.content || '').trim()) {
      return (m.content || '').trim();
    }
  }
  return undefined;
}

function summarizeAssistantTurn(content: string, max = 320): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

function threadLooksLikeTravel(messages: ConversationHistoryItem[], topicLabel?: string): boolean {
  const blob = [
    topicLabel || '',
    ...messages.map((m) => m.content || ''),
  ].join(' ');
  return TRAVEL_DOMAIN.test(blob);
}

export function classifyTopicTransition(input: {
  latestUserMessage: string;
  previousTopic?: ActiveTopicState;
  recentMessages?: ConversationHistoryItem[];
}): 'continuation' | 'shift' | 'ambiguous' {
  const { latestUserMessage, previousTopic, recentMessages = [] } = input;
  if (!previousTopic) return 'shift';

  const text = latestUserMessage.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (PRONOUN_CONTINUATION.test(text) || COMPARISON_WORDS.test(text)) return 'continuation';
  if (REFINEMENT_SIGNALS.test(text)) return 'continuation';

  if (previousTopic.entities.some((e) => text.includes(e.toLowerCase()))) return 'continuation';

  const travelThread = previousTopic.domain === 'travel' || threadLooksLikeTravel(recentMessages, previousTopic.label);
  if (travelThread && TRAVEL_DOMAIN.test(text)) return 'continuation';
  if (travelThread && wordCount <= SHORT_FOLLOWUP_MAX_WORDS) return 'continuation';

  if (QUESTION_WORDS.test(text) && wordCount < 8) return 'ambiguous';

  return 'shift';
}

export function buildConversationThreadHints(input: {
  latestUserMessage: string;
  recentMessages: ConversationHistoryItem[];
  continuity?: ConversationContinuityState;
  activeTopic?: ActiveTopicState;
}): ConversationThreadHints {
  const latest = input.latestUserMessage.trim();
  const transition = classifyTopicTransition({
    latestUserMessage: latest,
    previousTopic: input.activeTopic,
    recentMessages: input.recentMessages,
  });

  const lastAssistant = lastAssistantContent(input.recentMessages);
  const narrowingConstraints = collectThreadConstraints(input.recentMessages, latest);
  const priorPlaceSuggestions = lastAssistant ? extractPlaceSuggestions(lastAssistant) : [];

  const userMessages = input.recentMessages
    .filter((m) => m.role === 'user')
    .map((m) => (m.content || '').trim())
    .filter(Boolean);
  const lastUserMessages = [...userMessages, latest].slice(-4);

  const topic =
    transition === 'continuation'
      ? input.continuity?.currentTopic || input.activeTopic?.label || latest.slice(0, 80)
      : latest.slice(0, 80);

  const constraintPart =
    narrowingConstraints.length > 0 ? ` Constraints so far: ${narrowingConstraints.join('; ')}.` : '';

  const assistantPart = lastAssistant
    ? ` Last assistant turn mentioned: ${summarizeAssistantTurn(lastAssistant, 200)}`
    : '';

  const threadSummary =
    transition === 'continuation'
      ? `Ongoing thread about "${topic}".${constraintPart}${assistantPart} Continue narrowing — do not restart with generic destination lists.`
      : `New thread starting: "${latest.slice(0, 100)}".${constraintPart}`;

  return {
    threadSummary,
    activeTopicLabel: topic,
    momentum: transition === 'continuation' ? 'continue' : transition === 'ambiguous' ? 'ambiguous' : 'new_topic',
    narrowingConstraints,
    lastUserMessages,
    lastAssistantMessage: lastAssistant,
    priorPlaceSuggestions,
    isFollowUp: input.recentMessages.length > 0,
  };
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
    recentMessages: input.recentMessages,
  });
  const now = new Date().toISOString();

  const lastAssistant = lastAssistantContent(input.recentMessages);
  const narrowingConstraints = collectThreadConstraints(input.recentMessages, latest);

  const previousEntities = input.previousState?.activeEntities ?? [];
  const mergedEntities =
    transition === 'continuation'
      ? Array.from(new Set([...previousEntities, ...entities])).slice(0, 12)
      : entities;

  const domain =
    inferDomain(latest) ||
    input.previousTopic?.domain ||
    (threadLooksLikeTravel(input.recentMessages) ? 'travel' : undefined);

  const topicLabel =
    transition === 'continuation'
      ? input.previousState?.currentTopic || input.previousTopic?.label || latest.slice(0, 80)
      : domain === 'travel' && TRAVEL_DOMAIN.test(latest)
        ? 'Trip planning'
        : latest.slice(0, 80);

  const unresolved = QUESTION_WORDS.test(latest)
    ? [latest].slice(0, 4)
    : (input.previousState?.unresolvedQuestions ?? []).slice(0, 3);

  const continuity: ConversationContinuityState = {
    currentTopic: topicLabel,
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
    narrowingConstraints,
    lastAssistantTurnSummary: lastAssistant ? summarizeAssistantTurn(lastAssistant) : input.previousState?.lastAssistantTurnSummary,
    lastUpdatedAt: now,
  };

  const activeTopic: ActiveTopicState = {
    label: topicLabel,
    entities: mergedEntities.slice(0, 8),
    userGoal: continuity.userGoal,
    confidence: transition === 'continuation' ? 0.88 : transition === 'ambiguous' ? 0.58 : 0.75,
    updatedAt: now,
    domain,
  };

  return { continuity, activeTopic };
}

/**
 * Format recent turns for provider prompts (conversation mode).
 */
export function formatConversationTranscript(
  messages: ConversationHistoryItem[],
  options?: { maxMessages?: number; maxCharsPerMessage?: number }
): string {
  const maxMessages = options?.maxMessages ?? 10;
  const maxChars = options?.maxCharsPerMessage ?? 1200;
  const slice = messages.slice(-maxMessages);
  if (!slice.length) return '';

  return slice
    .map((msg) => {
      const label = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System';
      const body = (msg.content || '').trim().replace(/\n{3,}/g, '\n\n');
      const clipped = body.length > maxChars ? `${body.slice(0, maxChars)}…` : body;
      return `${label}:\n${clipped}`;
    })
    .join('\n\n---\n\n');
}
