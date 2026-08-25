/**
 * B′ — Broad current-state / attention discovery (unscoped).
 *
 * Semantic fact: the user is asking for a broad scan of current/recent things
 * they may need to know — without naming a subject, domain, or source.
 *
 * Used as a future C3 safety signal (do not skip module ContextProvider
 * orchestration). Does NOT set requiresAuthoritativeContext and does NOT
 * invent an attention / synthesis product.
 *
 * Prefer false negatives over false positives: scoped or subject-bearing
 * questions must remain false.
 */

function normalizeBroadDiscoveryQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[?.!,;:]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whole-utterance patterns only. If the query names a subject (with/in/about X,
 * domain object, etc.), it will not match — by design.
 */
const BROAD_DISCOVERY_UTTERANCES: RegExp[] = [
  // Attention (unscoped)
  /^what needs (?:my )?attention$/,
  /^anything needs? (?:my )?attention$/,
  /^does anything need (?:my )?attention$/,
  /^is there anything (?:that )?needs? (?:my )?attention$/,
  /^(?:is there )?anything i need to (?:deal with|handle|attend to)$/,

  // What's going on (unscoped; optional today / right now)
  /^what(?:'s| is|s) going on(?: today| right now)?$/,
  /^(?:is )?anything going on(?: today| right now)?$/,

  // Problems / wrong (unscoped)
  /^(?:are there )?(?:any )?problems(?: today)?$/,
  /^is anything wrong$/,
  /^anything i should be worried about$/,

  // Anything important / should know (unscoped; trailing "about" OK, "about X" is not)
  /^(?:is there )?anything important(?: today)?$/,
  /^(?:is there )?anything important i should know(?: about)?$/,
  /^(?:is there )?anything i should know(?: about)?$/,
  /^what should i know$/,
  /^anything new i should know(?: about)?$/,

  // What changed (unscoped temporal only)
  /^what(?:'s| has|s)? changed$/,
  /^what(?:'s| has|s)? changed today$/,
  /^what(?:'s| has|s)? changed since yesterday$/,
  /^anything (?:change|changed) since yesterday$/,
];

/**
 * True when the query is an unscoped broad current-state / attention discovery request.
 */
export function isBroadDiscoveryQuery(query: string): boolean {
  const q = normalizeBroadDiscoveryQuery(query);
  if (!q) return false;
  return BROAD_DISCOVERY_UTTERANCES.some((re) => re.test(q));
}
