/**
 * Detect when the user is referring to prior conversation / recorded personal facts.
 * Cross-session message recall and durable memory bias key off this signal.
 *
 * P-TRUTH: structure-based personal factual recall (grammatical I/we/me forms).
 * No subject-domain keywords (washer/house/car/…).
 */

const RECALL_PHRASES: RegExp[] = [
  /\b(last time|we (last )?talked|we discussed|we were discussing|as we talked about)\b/i,
  /\b(remember when|do you remember|you remember|can you remember)\b/i,
  /\b(what were we talking about|what were we discussing|what did we talk about)\b/i,
  /\b(what did we say about|what did you say about|what did i say about)\b/i,
  /\b(earlier you|you said earlier|you mentioned|you suggested|those places you mentioned)\b/i,
  /\b(previously|before we|pick up where|continue where we left)\b/i,
  /\b(the trip we discussed|that vacation|that trip|our trip planning)\b/i,
  /\b(continue our trip planning|continue planning (the |our )?trip)\b/i,
  /\b(what about that vacation|what about that trip)\b/i,
  /\b(where were we|what were the options|what were the places)\b/i,
  /\b(recall|refresh my memory|remind me what)\b/i,
  /\b(go back to what we|back to our conversation about)\b/i,
];

/**
 * P-TRUTH structural personal factual recall.
 * Bounded intervening phrase (≤60 word-ish chars) between "what" and personal did/was/have.
 */
const PERSONAL_FACTUAL_RECALL: RegExp[] = [
  // What [np] did I say|tell|mention|decide|like|want|prefer …
  /\bwhat\b[\s\w'-]{0,60}?\bdid\s+i\s+(?:say|tell|mention|decide|like|want|prefer)\b/i,
  // What [np] did we decide|discuss|talk about|say …
  /\bwhat\b[\s\w'-]{0,60}?\bdid\s+we\s+(?:decide|discuss|talk\s+about|say)\b/i,
  // What [np] was/were I considering|looking at …
  /\bwhat\b[\s\w'-]{0,50}?\b(?:was|were)\s+i\s+(?:considering|looking\s+at)\b/i,
  // What [np] have I been looking at …
  /\bwhat\b[\s\w'-]{0,50}?\bhave\s+i\s+been\s+looking\s+at\b/i,
  // What mattered/matters (most) to me
  /\bwhat\s+(?:mattered|matters)(?:\s+most)?\s+to\s+me\b/i,
  // What did I ask|tell you to remember
  /\bwhat\s+did\s+i\s+(?:ask|tell)\s+you\s+to\s+remember\b/i,
  // What [np] do you remember about me|my …
  /\bwhat\b[\s\w'-]{0,40}?\bdo\s+you\s+remember\s+about\s+(?:me|my)\b/i,
];

/** Travel/topic follow-up without explicit "last time" phrasing */
const TOPIC_FOLLOWUP =
  /\b(those places|the places|the destinations|the options we|which one was|what were they)\b/i;

const TRAVEL_CONTEXT = /\b(trip|travel|vacation|getaway|destination|weekend away)\b/i;

export function hasExplicitRecallIntent(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  if (RECALL_PHRASES.some((re) => re.test(q))) return true;
  if (PERSONAL_FACTUAL_RECALL.some((re) => re.test(q))) return true;
  if (TOPIC_FOLLOWUP.test(q) && TRAVEL_CONTEXT.test(q)) return true;
  if (TOPIC_FOLLOWUP.test(q) && /\b(remember|mentioned|discussed|said|talked)\b/i.test(q)) return true;
  return false;
}
