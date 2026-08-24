/**
 * P3: whether a request requires authoritative Vssyl / user / workspace / live data.
 *
 * Grounding requirement signal — not a full query taxonomy.
 * Pipeline intents may reinforce escape blocking but are imperfect alone.
 */

export interface AuthoritativeContextInput {
  query: string;
  fileIds?: unknown;
  businessId?: string | null;
  currentModule?: string | null;
  hasAttachedFiles?: boolean;
}

/** Action / mutation ambition (tools/permissions) — not a grounded factual read. */
export const ACTION_MUTATION =
  /\b(move|reschedule|cancel|delete|remove|share|create|add|update|send|book|remind|assign|invite|publish|upload|rename)\b.{0,50}\b(meeting|event|file|task|todo|message|invite|calendar|schedule)\b|\b(share this file|share\s+.+?\.(?:pdf|docx?|xlsx?|txt|pptx?)|create a (?:todo|task)|add a (?:todo|task)|schedule a meeting|move my .{0,30} meeting)\b/i;

/** Personal calendar / schedule current-state. */
const PERSONAL_CALENDAR_STATE =
  /\b(meetings?|calendar|agenda|schedule|scheduled|who am i meeting|who am i seeing|am i free|what(?:'s| is) on my (?:calendar|schedule)|(?:what do i have|do i have (?:anything )?)\s*scheduled)\b/i;

/** Drive / file personal current-state (shares, ownership, personal drive, document currency). */
const PERSONAL_FILE_STATE =
  /\b(files?|documents?|folders?)\b.{0,60}\b(share(?:d)?|sent|accessible|own(?:s|ed)?)\b|\b(shared|accessible)\b.{0,40}\b(files?|documents?)\b|\b(my|our)\s+(files?|documents?|drive)\b|\bwhat files?\b|\bwho owns\b|\bwho shared\b.{0,80}\bwith me\b|\bfiles?\s+(?:owned by|from)\b|\b(?:owned by)\b.{0,60}\b(?:that )?I can access\b|\bshow me (?:the )?(?:file|document)s?\b|\b(this|the|that)\s+(document|file|doc)\b.{0,40}\b(last\s+)?(updated|modified|changed|edited)\b|\bwhen was (this|the|that)\s+(document|file|doc)\b|\bwhat do i have in (?:my )?drive\b|\bwhat (?:files?|documents?) do i have\b|\bwhat (?:did i upload|have i uploaded)\b/i;

/**
 * Caller's own possession / inventory / current or recent personal activity.
 * Self-relative only — not business we/our operational discovery, not idioms like "what do I have to lose".
 */
const PERSONAL_POSSESSION_OR_LIVE_STATE = new RegExp(
  [
    // Due / waiting / tasks (user-relative)
    String.raw`\bwhat\s+do\s+i\s+have\s+(?:due|waiting)\b`,
    String.raw`\bwhat\s+do\s+i\s+have\s+waiting\s+(?:for\s+)?me\b`,
    String.raw`\b(?:what\s+)?tasks?\s+(?:are\s+)?waiting\s+(?:for\s+)?me\b`,
    String.raw`\bwhat\s+tasks?\s+(?:do\s+i\s+have\s+)?due\b`,
    // Notifications inventory
    String.raw`\bwhat\s+notifications?\s+(?:do\s+i\s+have|are\s+(?:there\s+)?(?:waiting\s+)?(?:for\s+)?me)\b`,
    // Recent self activity (source may remain unresolved)
    String.raw`\bwhat\s+was\s+i\s+working\s+on\b`,
    String.raw`\bwhat\s+changed\s+for\s+me\b`,
  ].join('|'),
  'i'
);

/** Workspace / business operational current-state. */
const WORKSPACE_CURRENT_STATE =
  /\b(our|my team(?:'s)?|company(?:'s)?|department(?:'s)?|this department)\b.{0,80}\b(labor|budget|sales|revenue|headcount|staffing|utilization|payroll|kpi|metrics|employees?|workforce|manager|org chart)\b|\b(labor|budget|sales|revenue|headcount|staffing|payroll)\b.{0,40}\b(our|current|today|yesterday|this week|tomorrow)\b|\bhow many employees\b|\bwho is scheduled\b|\bwho is the manager\b|\bmanager of (this |the |our )?department\b/i;

/**
 * Authenticated caller's own identity (User.name / User.email) — not definitional "what is an email".
 */
const SELF_IDENTITY_STATE =
  /\b(?:what(?:'s| is)|tell me|show me)\s+my\s+(?:email|name)\b|\bmy\s+(?:email|name)\b(?:\s+address)?\b|\bwhat\s+email\s+address\s+is\s+on\s+my\s+account\b|\b(?:email|name)\s+(?:address\s+)?(?:is\s+)?on\s+my\s+account\b/i;

/**
 * Caller's own employment/org facts — independent of whether businessId is currently supplied.
 */
const SELF_EMPLOYMENT_STATE =
  /\b(?:what(?:'s| is)|tell me|show me)\s+my\s+(?:job\s+)?(?:title|position|department)\b|\bmy\s+(?:job\s+)?(?:title|position|department|manager|boss|supervisor)\b|\bwhat\s+(?:job\s+)?(?:title|position|department)\s+am\s+i\s+(?:in|holding)\b|\bwhich\s+department\s+do\s+i\s+work\s+in\b|\bwho\s+(?:is\s+my\s+(?:manager|boss|supervisor)|do\s+i\s+report\s+to)\b/i;

/**
 * Referent for a specific person/role (not definitional "people"/"managers").
 * Includes pronouns for follow-ups ("explain what she sent me").
 */
const HISTORY_PERSON_REF =
  '(?:she|he|they|my\\s+(?:manager|boss|supervisor)|[A-Za-z][\\w\'-]{1,40}(?:\\s+[A-Za-z][\\w\'-]{1,40})?)';

/**
 * Specific user-relative historical / referential truth.
 * Truth YES + source may be unresolved (Drive / Chat / other).
 * Does not invent a module — only marks authoritative context required.
 */
const SPECIFIC_USER_RELATIVE_HISTORY = new RegExp(
  [
    // "What did Sarah send me?" / "What did my manager share with me yesterday?"
    String.raw`\b(?:explain\s+)?what\s+did\s+${HISTORY_PERSON_REF}\s+(?:send|share|say|tell|assign|give)\b.{0,60}\b(?:me|to\s+me)\b`,
    // "Explain what Sarah sent me." / "Explain what she shared with me."
    String.raw`\bexplain\s+what\s+${HISTORY_PERSON_REF}\s+(?:sent|shared|said|told|assigned|gave)\b.{0,60}\b(?:me|to\s+me)\b`,
    // Past tense without "did": "What Sarah sent me" / "What she told me"
    // Also: "What was the last thing Sarah gave me?" (intervening phrase before person)
    String.raw`\bwhat\s+(?:was\s+(?:the\s+)?(?:last\s+)?(?:thing\s+)?)?${HISTORY_PERSON_REF}\s+(?:sent|shared|said|told|assigned|gave)\b.{0,40}\b(?:me|to\s+me)\b`,
    // Explicit typed objects: "What file/document/message did Sarah send/share…"
    String.raw`\bwhat\s+(?:file|document|message|doc)s?\s+did\s+${HISTORY_PERSON_REF}\s+(?:send|share|say|tell|assign|give)\b`,
  ].join('|'),
  'i'
);

/** Definitional / how-to language — must not trip historical-person patterns alone. */
const GENERAL_CONCEPT_CUE =
  /\b(?:what does|what is|what means|what makes|how does|how do|how should|why do|why does|meaning of)\b/i;

function hasFileIds(fileIds: unknown): boolean {
  return Array.isArray(fileIds) && fileIds.length > 0;
}

/**
 * True when the user is asking to mutate / execute (not a factual read).
 */
export function isActionMutationRequest(query: string): boolean {
  return ACTION_MUTATION.test((query || '').trim());
}

/**
 * True when answering correctly requires Vssyl/user/workspace/live truth
 * (as opposed to general model knowledge).
 *
 * Separates "requires authoritative data" from "authoritative data exists."
 * Separates truth requirement from source/module resolution.
 */
export function requiresAuthoritativeContext(input: AuthoritativeContextInput): boolean {
  const q = (input.query || '').trim();
  if (!q) return false;

  // Mutations are not grounded factual reads — handled separately.
  if (isActionMutationRequest(q)) {
    return false;
  }

  if (input.hasAttachedFiles || hasFileIds(input.fileIds)) {
    return true;
  }

  if (SELF_IDENTITY_STATE.test(q)) {
    return true;
  }

  if (SELF_EMPLOYMENT_STATE.test(q)) {
    return true;
  }

  // Live personal calendar/file/possession state — not definitional how-to / why-do.
  // Exception: "What is on my calendar?" embeds "what is" but is live retrieval.
  if (GENERAL_CONCEPT_CUE.test(q)) {
    if (/\bwhat(?:'s| is) on my (?:calendar|schedule)\b/i.test(q)) {
      return true;
    }
  } else {
    if (PERSONAL_CALENDAR_STATE.test(q)) {
      return true;
    }
    if (PERSONAL_FILE_STATE.test(q)) {
      return true;
    }
    if (PERSONAL_POSSESSION_OR_LIVE_STATE.test(q)) {
      return true;
    }
  }

  // Specific person/history directed at the caller — source may still be unresolved.
  if (SPECIFIC_USER_RELATIVE_HISTORY.test(q) && !GENERAL_CONCEPT_CUE.test(q)) {
    return true;
  }

  if (WORKSPACE_CURRENT_STATE.test(q)) {
    return true;
  }

  const module = (input.currentModule || '').trim().toLowerCase();
  if (
    module &&
    ['calendar', 'drive', 'hr', 'scheduling', 'workforce_comms', 'business'].includes(module) &&
    /\b(my|our|today|tomorrow|this week|yesterday|current|scheduled|shared|document|file)\b/i.test(q)
  ) {
    return true;
  }

  // Operational business-scope cues — not bare "manager"/"department" (definitional false positives).
  if (
    typeof input.businessId === 'string' &&
    input.businessId.trim() !== '' &&
    /\b(our|team|labor|budget|employees?|staffing|payroll|utilization|sales|revenue|headcount)\b/i.test(
      q
    )
  ) {
    return true;
  }

  return false;
}
