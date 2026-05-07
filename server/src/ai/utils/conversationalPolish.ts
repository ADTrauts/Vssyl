/**
 * Post-generation conversational polish for user-facing text.
 * Keeps meaning while removing internal orchestration phrasing.
 */

const STRIP_PREFIX_PATTERNS: RegExp[] = [
  /^\s*based on (conversation history|the conversation history|user module context|module context)\s*[:,-]?\s*/i,
  /^\s*user module context\s*[:,-]?\s*/i,
  /^\s*conversation history\s*[:,-]?\s*/i,
];

const HEADING_LINE_PATTERNS: RegExp[] = [
  /^\s*assumptions\s*:?\s*$/i,
  /^\s*risks\s*:?\s*$/i,
  /^\s*recommended actions\s*:?\s*$/i,
  /^\s*key insights\s*:?\s*$/i,
  /^\s*based on\s*:?\s*$/i,
  /^\s*confidence\s*:?\s*$/i,
];

const INTERNAL_PHRASE_PATTERNS: RegExp[] = [
  /\buser module context\b/gi,
  /\bbased on conversation history\b/gi,
  /\bbased on the conversation history\b/gi,
];

function collapseWhitespace(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Strip internal orchestration headings while keeping actionable bullet text.
 */
function stripInternalHeadings(text: string): string {
  const lines = text.split('\n');
  const kept: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (HEADING_LINE_PATTERNS.some((p) => p.test(line))) {
      continue;
    }
    // Remove confidence score lines in plain text outputs.
    if (/^confidence\s*:\s*\d+%?$/i.test(line)) {
      continue;
    }
    kept.push(rawLine);
  }
  return kept.join('\n');
}

export function polishConversationalResponse(input: string): string {
  let out = (input || '').trim();
  if (!out) return out;

  for (const pattern of STRIP_PREFIX_PATTERNS) {
    out = out.replace(pattern, '');
  }

  out = stripInternalHeadings(out);

  for (const pattern of INTERNAL_PHRASE_PATTERNS) {
    out = out.replace(pattern, '');
  }

  out = out.replace(/\b(manual|automated|suggested)\s*→\s*([a-z0-9_-]+)/gi, '$2');

  return collapseWhitespace(out);
}
