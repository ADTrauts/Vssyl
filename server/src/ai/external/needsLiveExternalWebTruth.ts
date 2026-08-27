/**
 * Small generic LIVE/CURRENT signal for public-web source need.
 * Feeds pipeline grounding only — not C3 / requiresAuthoritativeContext / ContextProviders.
 */

/**
 * True when the request materially depends on information that may have changed
 * since base-model training (live public external truth).
 */
export function needsLiveExternalWebTruth(userMessage: string): boolean {
  const text = (userMessage || '').trim();
  if (!text) return false;

  if (
    /\b(today|right\s+now|this\s+morning|this\s+afternoon|this\s+evening|up\s+to\s+date|as\s+of\s+(today|now))\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (/\bwhat'?s\s+happening\b/i.test(text) || /\b(in\s+the\s+)?news\b/i.test(text)) {
    return true;
  }

  // Allow a few intervening tokens: "current mortgage rates", "latest interest rates".
  // Do not match definitional "current ratio" / "current assets" (those nouns are not in the set).
  if (
    /\b(current|latest|recent)\s+(?:\w+[-\s]+){0,2}(price|prices|rate|rates|ceo|cost|costs|news|events?|market)\b/i.test(
      text
    )
  ) {
    return true;
  }

  if (/\bwho\s+is\s+the\s+current\s+ceo\b/i.test(text)) {
    return true;
  }

  if (/\b(currently|at\s+the\s+moment)\b/i.test(text) && /\b(price|rate|cost|ceo|news)\b/i.test(text)) {
    return true;
  }

  return false;
}
