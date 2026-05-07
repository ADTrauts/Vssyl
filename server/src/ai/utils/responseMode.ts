export type AIResponseMode =
  | 'conversational'
  | 'analytical'
  | 'planning'
  | 'emotional_support'
  | 'debug'
  | 'executive_summary';

const ANALYTICAL_HINTS = /\b(break this down|analyze|analysis|compare|pros and cons|tradeoff)\b/i;
const PLANNING_HINTS = /\b(next steps|step by step|plan|roadmap|implementation plan|how should i proceed)\b/i;
const DEBUG_HINTS = /\b(why did the ai answer this way|show reasoning|debug|internal details|explain your reasoning)\b/i;
const EXEC_SUMMARY_HINTS = /\b(executive summary|tldr|tl;dr|summary for leadership)\b/i;
const EMOTIONAL_HINTS = /\b(i feel|i'm stressed|i am stressed|overwhelmed|anxious|burned out|upset)\b/i;

export function inferResponseMode(input: {
  query: string;
  explicitMode?: string;
}): AIResponseMode {
  const explicit = (input.explicitMode || '').trim().toLowerCase();
  if (
    explicit === 'conversational' ||
    explicit === 'analytical' ||
    explicit === 'planning' ||
    explicit === 'emotional_support' ||
    explicit === 'debug' ||
    explicit === 'executive_summary'
  ) {
    return explicit;
  }

  const q = input.query || '';
  if (DEBUG_HINTS.test(q)) return 'debug';
  if (PLANNING_HINTS.test(q)) return 'planning';
  if (ANALYTICAL_HINTS.test(q)) return 'analytical';
  if (EXEC_SUMMARY_HINTS.test(q)) return 'executive_summary';
  if (EMOTIONAL_HINTS.test(q)) return 'emotional_support';
  return 'conversational';
}
