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

/** Person name for imperative communication targets (not pronouns/history refs). */
const ACTION_PERSON_REF = '[A-Za-z][\\w\'-]{1,40}(?:\\s+[A-Za-z][\\w\'-]{1,40})?';

/**
 * Direct communication / notify imperatives — message/tell/reply without requiring a second entity noun.
 */
const COMMUNICATION_ACTION = new RegExp(
  [
    // "Message Sarah." / "Please message Sarah." / "Can you message Sarah?"
    String.raw`\b(?:please\s+|can you\s+|could you\s+|i want you to\s+|i(?:'d| would) like you to\s+)?message\s+${ACTION_PERSON_REF}\b`,
    String.raw`\bsend\s+(?:${ACTION_PERSON_REF}\s+)?a\s+message\b`,
    String.raw`\bsend\s+a\s+message\s+to\s+${ACTION_PERSON_REF}\b`,
    // "Tell Sarah I'll be late." — not "tell me my …"
    String.raw`\b(?:please\s+|can you\s+|could you\s+|i want you to\s+|i(?:'d| would) like you to\s+)?tell\s+(?!me\b)${ACTION_PERSON_REF}\b`,
    String.raw`\b(?:please\s+|can you\s+|could you\s+)?let\s+${ACTION_PERSON_REF}\s+know\b`,
    String.raw`\b(?:please\s+|can you\s+|could you\s+)?notify\s+${ACTION_PERSON_REF}\b`,
    String.raw`\b(?:please\s+|can you\s+|could you\s+)?ask\s+${ACTION_PERSON_REF}\b.{0,40}\b(?:if|whether|about|when|where|why|how|available)\b`,
    String.raw`\b(?:reply|respond)\s+to\s+${ACTION_PERSON_REF}\b`,
  ].join('|'),
  'i'
);

/**
 * Share/send/grant imperatives with referential object ("this/that/it") — resource may be unresolved.
 */
const SHARE_SEND_REFERENTIAL_ACTION =
  /\b(?:please\s+|can you\s+|could you\s+)?(?:share|send)\s+(?:this|that|it|the\s+(?:file|document))\b.{0,60}\b(?:with|to)\b|\b(?:give|grant)\s+[A-Za-z][\w'-]{1,40}(?:\s+[A-Za-z][\w'-]{1,40})?\s+access\b/i;

/**
 * Historical / interrogative reads about past sends/shares/messages — not mutations.
 */
const ACTION_HISTORICAL_READ_GUARD = new RegExp(
  [
    String.raw`\b(?:what|who|when|which)\s+(?:did|was|were|has|have)\b`,
    String.raw`\bexplain\s+what\b`,
    String.raw`\bwhat\s+(?:file|document|message|doc)s?\s+did\b`,
    String.raw`\bwho\s+(?:shared|sent|messaged|message)\b`,
    String.raw`\bwhat\s+did\s+i\s+send\b`,
    String.raw`\bwhat\s+(?:was\s+(?:the\s+)?(?:last\s+)?(?:thing\s+)?)?(?:she|he|they|my\s+(?:manager|boss|supervisor)|${ACTION_PERSON_REF})\s+(?:sent|shared|said|told|assigned|gave)\b`,
  ].join('|'),
  'i'
);

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
  /\b(our|my team(?:'s)?|company(?:'s)?|department(?:'s)?|this department)\b.{0,80}\b(labor|budget|sales|revenue|headcount|staffing|staffed|utilization|payroll|kpi|metrics|employees?|workforce|manager|org chart)\b|\b(labor|budget|sales|revenue|headcount|staffing|staffed|payroll)\b.{0,40}\b(our|current|today|yesterday|this week|tomorrow)\b|\bhow many employees\b|\bwho is scheduled\b|\bwho is the manager\b|\bmanager of (this |the |our )?department\b/i;

/**
 * Active-business live operational state (requires businessId).
 * we/our + evaluation/temporal staffing, budget, absence, or performance — not broad discovery.
 */
const BUSINESS_SCOPED_LIVE_STATE = new RegExp(
  [
    // Budget / labor-cost actual state
    String.raw`\b(?:are we|are (?:our|the))(?:\s+\w+){0,8}\s*(?:over|under|on)\s+(?:our\s+)?budget\b`,
    String.raw`\bare (?:our|the)?\s*labor costs?\b.{0,40}\b(?:high|low|over|under)\b`,
    String.raw`\bare labor costs?\b.{0,40}\b(?:high|low|over|under)\b`,
    // Staffing state (staffed / understaffed / short-staffed morphological variants)
    String.raw`\bare we (?:fully|under|over)[\s-]?staffed\b`,
    String.raw`\bare we staff(?:ed|ing)\b`,
    String.raw`\bare we short[\s-]?staffed\b`,
    String.raw`\bdo we have enough staff\b`,
    String.raw`\bare we meeting (?:our )?staffing needs\b`,
    // Absence / time off
    String.raw`\b(?:is|are) (?:anyone|anybody) (?:out|off|absent)\b`,
    String.raw`\bdo we have (?:anyone|anybody) (?:out|off)\b`,
    // Performance / how are we doing
    String.raw`\bhow (?:are|did|was) we (?:doing|perform(?:ing)?)\b`,
    String.raw`\bhow was (?:our )?performance\b`,
  ].join('|'),
  'i'
);

/**
 * Explicit HR / org queries (requires businessId) — overview, absence lists, dept manager, headcount phrasing.
 * Distinct from TM1 self-employment ("my manager") and B1 live-state ("is anyone out").
 */
const EXPLICIT_HR_ORG_STATE = new RegExp(
  [
    String.raw`\b(?:give me|show me|get me)\s+(?:an?\s+)?(?:overview of\s+)?hr\b`,
    String.raw`\b(?:what(?:'s| is)|show me)\s+(?:our|the)\s+hr\s+(?:overview|status)\b`,
    String.raw`\bhr\s+overview\b`,
    String.raw`\bwho(?:'s| is)\s+(?:off|out|on leave|absent)\b`,
    String.raw`\bwho has pto\b`,
    String.raw`\bwho(?:'s| is)\s+on pto\b`,
    String.raw`\bwho (?:manages|runs)\s+(?:the\s+)?[A-Za-z][\w\s'-]+(?:\s+department)?\b`,
    String.raw`\bwho is the manager of\s+(?:the\s+)?[A-Za-z][\w\s'-]+\b`,
    String.raw`\bmanager of\s+(?:the\s+)?[A-Za-z][\w\s'-]+\s+department\b`,
  ].join('|'),
  'i'
);

/** Tenant-scoped PTO policy (business truth; not general "what is PTO"). */
const TENANT_PTO_POLICY =
  /\b(?:what(?:'s| is)\s+)?our\s+pto\s+policy\b/i;

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

/** Definitional / how-to / advisory language — must not trip live-state patterns alone. */
const GENERAL_CONCEPT_CUE =
  /\b(?:what does|what is|what means|what makes|what causes|what should|how does|how do|how should|how can|why do|why does|why is|meaning of|explain the concept)\b/i;

/**
 * W1 — active-module shorthand (Calendar / HR / Drive only).
 * Module-relative live-state cues; not definitional how-to.
 * "What is next?" embeds "what is" but is calendar shorthand — handled via resolveActiveModuleShorthand.
 */
const CALENDAR_ACTIVE_SHORTHAND =
  /\b(?:what(?:'s| is)\s+next(?:\s+today)?|what(?:'s| is)\s+coming\s+up|anything\s+coming\s+up)\b/i;

const HR_ACTIVE_SHORTHAND =
  /\b(?:how\s+many(?:\s+(?:are\s+there|employees?|people))?\b|who(?:'s| is)\s+(?:out|off)\b)/i;

const DRIVE_ACTIVE_SHORTHAND =
  /\b(?:what(?:'s| is)\s+new(?:\s+recently)?|anything\s+new|any\s+new\s+files?)\b/i;

export type ActiveModuleShorthandModule = 'calendar' | 'hr' | 'drive';

function hasFileIds(fileIds: unknown): boolean {
  return Array.isArray(fileIds) && fileIds.length > 0;
}

function hasBusinessScope(input: AuthoritativeContextInput): boolean {
  return typeof input.businessId === 'string' && input.businessId.trim() !== '';
}

/**
 * W1: when currentModule is a real audited module and the query is bounded module-relative shorthand,
 * return that module id for truth + preferred retrieval candidate.
 * Does not apply to ai-chat / search / unaudited modules.
 */
export function resolveActiveModuleShorthand(
  input: AuthoritativeContextInput
): ActiveModuleShorthandModule | null {
  const q = (input.query || '').trim();
  if (!q) return null;

  const module = (input.currentModule || '').trim().toLowerCase();
  if (!module || module === 'ai-chat' || module === 'search') {
    return null;
  }

  // Calendar shorthand may embed "what is" (e.g. "What is next?") — allow when pattern matches.
  if (module === 'calendar' && CALENDAR_ACTIVE_SHORTHAND.test(q)) {
    return 'calendar';
  }

  if (
    module === 'hr' &&
    hasBusinessScope(input) &&
    HR_ACTIVE_SHORTHAND.test(q) &&
    !GENERAL_CONCEPT_CUE.test(q)
  ) {
    return 'hr';
  }

  // Drive shorthand may embed "what is" (e.g. "What is new?") — allow when pattern matches.
  if (module === 'drive' && DRIVE_ACTIVE_SHORTHAND.test(q)) {
    return 'drive';
  }

  return null;
}

/**
 * True when the user is asking to mutate / execute (not a factual read).
 */
export function isActionMutationRequest(query: string): boolean {
  const q = (query || '').trim();
  if (!q) return false;

  if (GENERAL_CONCEPT_CUE.test(q)) {
    return false;
  }

  if (ACTION_HISTORICAL_READ_GUARD.test(q) || SPECIFIC_USER_RELATIVE_HISTORY.test(q)) {
    return false;
  }

  if (ACTION_MUTATION.test(q)) {
    return true;
  }
  if (COMMUNICATION_ACTION.test(q)) {
    return true;
  }
  if (SHARE_SEND_REFERENTIAL_ACTION.test(q)) {
    return true;
  }

  return false;
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

  // W1: bounded active-module shorthand only (calendar / hr / drive).
  // Module location does not imply question domain — no broad currentModule+possessive fallback.
  if (resolveActiveModuleShorthand(input)) {
    return true;
  }

  // B1 + H1: active-business scope — requires businessId; no tenant auto-selection.
  if (hasBusinessScope(input)) {
    // H1: our PTO policy embeds "what is" but is tenant-specific truth.
    if (TENANT_PTO_POLICY.test(q)) {
      return true;
    }
    if (!GENERAL_CONCEPT_CUE.test(q)) {
      if (BUSINESS_SCOPED_LIVE_STATE.test(q)) {
        return true;
      }
      if (EXPLICIT_HR_ORG_STATE.test(q)) {
        return true;
      }
      // Explicit our/team operational metrics (e.g. labor budget) — not definitional/advisory.
      if (
        /\b(our|team|labor|budget|employees?|staffing|staffed|payroll|utilization|sales|revenue|headcount)\b/i.test(
          q
        )
      ) {
        return true;
      }
    }
  }

  return false;
}
