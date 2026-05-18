/**
 * Post-generation conversational polish for user-facing text.
 * Keeps meaning while removing internal orchestration phrasing.
 */

export interface PolishConversationalOptions {
  conversationMode?: boolean;
}

const STRIP_PREFIX_PATTERNS: RegExp[] = [
  /^\s*based on (conversation history|the conversation history|user module context|module context)\s*[:,-]?\s*/i,
  /^\s*user module context\s*[:,-]?\s*/i,
  /^\s*conversation history\s*[:,-]?\s*/i,
  /^\s*considering your (current )?work[- ]life balance(?:\s+and\s+productivity scores?)?\s*,?\s*/i,
  /^\s*based on your (current )?productivity scores?\s*,?\s*/i,
  /^\s*your dashboard indicates\s*,?\s*/i,
  /^\s*your life twin data suggests\s*,?\s*/i,
  /^\s*your behavioral patterns show\s*,?\s*/i,
];

const HEADING_LINE_PATTERNS: RegExp[] = [
  /^\s*assumptions\s*:?\s*$/i,
  /^\s*risks\s*:?\s*$/i,
  /^\s*recommended actions\s*:?\s*$/i,
  /^\s*key insights\s*:?\s*$/i,
  /^\s*based on\s*:?\s*$/i,
  /^\s*confidence\s*:?\s*$/i,
  /^\s*context\s*\/\s*watchouts\s*:?\s*$/i,
  /^\s*evidence\s*:?\s*$/i,
];

const INTERNAL_PHRASE_PATTERNS: RegExp[] = [
  /\buser module context\b/gi,
  /\bbased on conversation history\b/gi,
  /\bbased on the conversation history\b/gi,
  /\bbased on your (current )?productivity score\b/gi,
  /\bbased on your (current )?work[- ]life balance\b/gi,
  /\byour dashboard indicates\b/gi,
  /\byour life twin data suggests\b/gi,
  /\byour behavioral patterns show\b/gi,
  /\bkey insights\b/gi,
  /\brecommended actions\b/gi,
];

const CONVERSATION_FRAMEWORK_PATTERNS: RegExp[] = [
  /\b(decision matrix|optimization framework|structured approach|actionable framework)\b/gi,
  /\b(here are my key insights|recommended next steps|from an analytical perspective)\b/gi,
  /\b(I recommend the following framework|let me break this down into)\b/gi,
  /\b(as your (AI )?assistant, I suggest you optimize)\b/gi,
  /\boptimize your productivity\b/gi,
  /\b(work[- ]life balance (score|metrics))\b/gi,
  /\b(productivity score)\b/gi,
];

/** Generic travel-blog / safe-AI phrasing to soften in conversation mode. */
const GENERIC_BROCHURE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bconsider destinations like\b/gi, replacement: 'I\'d look at' },
  { pattern: /\bpopular options include\b/gi, replacement: 'Strong fits include' },
  { pattern: /\byou may want to\b/gi, replacement: 'I\'d' },
  { pattern: /\bfor a more secluded getaway\b/gi, replacement: 'if you want something quieter' },
  { pattern: /\boffers historic charm\b/gi, replacement: 'has a relaxed, historic feel' },
  { pattern: /\bhas culture and food\b/gi, replacement: 'is incredible for food and energy' },
];

function collapseWhitespace(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function stripInternalHeadings(text: string): string {
  const lines = text.split('\n');
  const kept: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (HEADING_LINE_PATTERNS.some((p) => p.test(line))) {
      continue;
    }
    if (/^confidence\s*:\s*\d+%?$/i.test(line)) {
      continue;
    }
    kept.push(rawLine);
  }
  return kept.join('\n');
}

export function polishConversationalResponse(
  input: string,
  options?: PolishConversationalOptions
): string {
  let out = (input || '').trim();
  if (!out) return out;

  for (const pattern of STRIP_PREFIX_PATTERNS) {
    out = out.replace(pattern, '');
  }

  out = stripInternalHeadings(out);

  for (const pattern of INTERNAL_PHRASE_PATTERNS) {
    out = out.replace(pattern, '');
  }

  if (options?.conversationMode) {
    for (const pattern of CONVERSATION_FRAMEWORK_PATTERNS) {
      out = out.replace(pattern, '');
    }
    for (const { pattern, replacement } of GENERIC_BROCHURE_PATTERNS) {
      out = out.replace(pattern, replacement);
    }
    out = out.replace(/\b(in conclusion|to summarize|overall,)\s*,?\s*/gi, '');
    out = out.replace(/\s{2,}/g, ' ');
  }

  out = out.replace(/\b(manual|automated|suggested)\s*→\s*([a-z0-9_-]+)/gi, '$2');

  return collapseWhitespace(out);
}
