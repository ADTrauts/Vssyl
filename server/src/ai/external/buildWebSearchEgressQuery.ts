/**
 * Bounded public egress query for web_search.
 * Never receives Twin prompt, memory, attachments, or business dumps.
 */

const MAX_EGRESS_LEN = 280;

export type WebSearchEgressOutcome =
  | { egressQuery: string }
  | { policyDenied: true; reason: string };

/**
 * Structural safety on the outbound query string only.
 * Does not classify topics — blocks private-looking material leakage.
 */
export function assertSafeWebEgressQuery(egressQuery: string): WebSearchEgressOutcome {
  const q = egressQuery.trim();
  if (!q) {
    return { policyDenied: true, reason: 'empty_egress_query' };
  }
  if (q.length > 400) {
    return { policyDenied: true, reason: 'egress_query_too_long' };
  }
  if (/\n{2,}/.test(q) || q.split('\n').length > 3) {
    return { policyDenied: true, reason: 'multi_block_egress' };
  }
  if (/\b(sk-[a-zA-Z0-9]{16,}|Bearer\s+[A-Za-z0-9._\-]{20,})\b/.test(q)) {
    return { policyDenied: true, reason: 'credential_like_material' };
  }
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(q)) {
    return { policyDenied: true, reason: 'ssn_like_material' };
  }
  // Continuous digit runs that look like PANs / account numbers.
  if (/\d(?:[\s-]?\d){12,18}/.test(q)) {
    return { policyDenied: true, reason: 'account_like_material' };
  }
  if (/\b(BEGIN\s+PRIVATE|CONFIDENTIAL\s+INTERNAL|EMPLOYEE\s+RECORD)\b/i.test(q)) {
    return { policyDenied: true, reason: 'marked_private_material' };
  }
  return { egressQuery: q };
}

/**
 * Build a public search string from the user message alone.
 * Strips personal framing that should not leave Vssyl; keeps user-typed public terms.
 */
export function buildWebSearchEgressQuery(userMessage: string): WebSearchEgressOutcome {
  let text = (userMessage || '').trim().replace(/\s+/g, ' ');
  if (!text) {
    return { policyDenied: true, reason: 'empty_user_message' };
  }

  // Soft public rewrite when user asks if a private offer is competitive (no domain intent type).
  // Apply on the full message before sentence isolation so topic words are not lost.
  if (
    /\b(competitive|compare|good\s+rate|average)\b/i.test(text) &&
    (/\b(mortgage|rate|rates|apr|interest|lender|loan)\b/i.test(text) ||
      /\b\d+(\.\d+)?%\b/.test(text))
  ) {
    const year = new Date().getFullYear();
    return assertSafeWebEgressQuery(
      `average current 30 year fixed mortgage rates United States ${year}`
    );
  }

  // Prefer a single ask sentence when compound (personal fact + live question).
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    const liveIdx = sentences.findIndex((s) =>
      /\b(today|right\s+now|current|competitive|compare|news|happening|price|rate)\b/i.test(s)
    );
    if (liveIdx >= 0) {
      text = sentences[liveIdx]!;
    }
  }

  // Drop personal percentage offers from egress (keep public market ask).
  text = text.replace(/\bmy\s+lender\s+offered\s+me\s+[\d.]+%\.?\s*/gi, '');
  text = text.replace(/\bi\s+(?:was\s+)?(?:offered|quoted)\s+[\d.]+%\.?\s*/gi, '');
  text = text.replace(/\b[\d.]+%\b/g, '');

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > MAX_EGRESS_LEN) {
    text = text.slice(0, MAX_EGRESS_LEN).trim();
  }

  return assertSafeWebEgressQuery(text);
}
