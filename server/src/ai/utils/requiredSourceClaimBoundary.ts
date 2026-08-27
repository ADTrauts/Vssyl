/**
 * Required-source claim boundary — independent of pipeline enforcement mode.
 * When a required source fails, claims that depend on it must not reach the user.
 */

export const REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION = `REQUIRED SOURCE FAILURE — CLAIM BOUNDARY:
A source required to answer the live/current or authoritative portion of the user's request was unavailable.
- Do not infer, estimate, recall, or supply the unavailable current or authoritative facts from model memory.
- Explicitly state that the current or required information could not be verified because that source was unavailable.
- Stable/general information that does not depend on the failed source may still be explained.
- Never invent current rates, prices, headlines, place listings, or other facts that required the failed source.`;

/** Live external sources that establish a hard post-generation claim boundary (Wave 1). */
const HARD_CLAIM_BOUNDARY_SOURCES = new Set(['web_search', 'google_places']);

export function normalizeRequiredSourceFailures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    ),
  ];
}

export function hasRequiredSourceFailures(failures: string[]): boolean {
  return failures.length > 0;
}

export function hasHardLiveExternalSourceFailure(failures: string[]): boolean {
  return failures.some((id) => HARD_CLAIM_BOUNDARY_SOURCES.has(id));
}

export function buildRequiredSourceFailureDisclosure(failures: string[]): string {
  const unique = normalizeRequiredSourceFailures(failures);
  const mentionsWeb = unique.includes('web_search');
  const mentionsPlaces = unique.includes('google_places');

  if (mentionsWeb && !mentionsPlaces) {
    return (
      "I couldn't verify the live/current information you asked for because web search is unavailable right now. " +
      "I won't invent current rates, prices, headlines, or other live figures from memory. " +
      'I can still explain stable general concepts that do not depend on live data — ask if you want that kind of overview, or try again when live search is available.'
    );
  }

  if (mentionsPlaces && !mentionsWeb) {
    return (
      "I couldn't look up live place results because place search is unavailable right now. " +
      "I won't invent specific businesses or listings from memory. " +
      'Share more detail or try again when place search is available.'
    );
  }

  if (mentionsWeb && mentionsPlaces) {
    return (
      "I couldn't verify live web or place information because a required external source is unavailable right now. " +
      "I won't invent current figures or listings from memory. " +
      'Ask for a general explanation that does not need live data, or try again later.'
    );
  }

  const labels = unique.join(', ');
  return (
    `I couldn't verify the parts of your question that need required source data (${labels}), because that source was unavailable. ` +
    "I won't invent those facts from memory. " +
    'Ask for a general explanation that does not depend on that source, or try again when it is available.'
  );
}

export function responseDisclosesRequiredSourceLimitation(response: string): boolean {
  const text = (response || '').trim();
  if (!text) return false;
  return (
    /\bcould(?:n'?t| not) verify\b/i.test(text) ||
    /\bunable to verify\b/i.test(text) ||
    /\b(?:live )?(?:web )?search is unavailable\b/i.test(text) ||
    /\brequired source (?:was |is )?unavailable\b/i.test(text) ||
    /\bcould(?:n'?t| not) (?:look up|retrieve|access|get) (?:live|current|today)/i.test(text) ||
    /\bplace search is unavailable\b/i.test(text)
  );
}

/**
 * Heuristic: response still asserts unverified live/current facts after a required live source failed.
 */
export function responseAssertsUnsupportedLiveClaims(response: string): boolean {
  const text = (response || '').trim();
  if (!text) return false;

  if (/\bas of (today|now)\b/i.test(text)) return true;
  if (
    /\b(today|right now|currently|this morning|this afternoon)\b[\s\S]{0,120}\b\d+(\.\d+)?\s*(%|percent)\b/i.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(rate|rates|price|prices)\b[\s\S]{0,60}\b(is|are|around|approximately|about|near)\b[\s\S]{0,40}\d+(\.\d+)?/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

export interface ApplyRequiredSourceClaimBoundaryResult {
  response: string;
  applied: boolean;
  reason?: 'hard_live_external_failure' | 'unsupported_live_claim_detected';
}

/**
 * Deterministic safety: required-source failures must not silently yield unsupported claims.
 * Independent of pipeline enforcement enablement/mode.
 *
 * For hard live-external failures (web_search / google_places): keep the model response only when
 * it discloses the limitation and does not assert unsupported live claims (allows mixed stable
 * explanations). Otherwise replace with a bounded disclosure.
 */
export function applyRequiredSourceClaimBoundary(input: {
  response: string;
  requiredSourceFailures: string[];
}): ApplyRequiredSourceClaimBoundaryResult {
  const failures = normalizeRequiredSourceFailures(input.requiredSourceFailures);
  if (failures.length === 0) {
    return { response: input.response, applied: false };
  }

  const response = input.response || '';

  if (hasHardLiveExternalSourceFailure(failures)) {
    const discloses = responseDisclosesRequiredSourceLimitation(response);
    const asserts = responseAssertsUnsupportedLiveClaims(response);
    if (!discloses || asserts) {
      return {
        response: buildRequiredSourceFailureDisclosure(failures),
        applied: true,
        reason: 'hard_live_external_failure',
      };
    }
    return { response, applied: false };
  }

  if (responseAssertsUnsupportedLiveClaims(response) && !responseDisclosesRequiredSourceLimitation(response)) {
    return {
      response: buildRequiredSourceFailureDisclosure(failures),
      applied: true,
      reason: 'unsupported_live_claim_detected',
    };
  }

  return { response, applied: false };
}
