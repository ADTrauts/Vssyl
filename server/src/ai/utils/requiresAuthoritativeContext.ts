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
  /\b(move|reschedule|cancel|delete|remove|share|create|add|update|send|book|remind|assign|invite|publish|upload|rename)\b.{0,50}\b(meeting|event|file|task|todo|message|invite|calendar|schedule)\b|\b(share this file|create a (?:todo|task)|add a (?:todo|task)|schedule a meeting|move my .{0,30} meeting)\b/i;

/** Personal calendar / schedule current-state. */
const PERSONAL_CALENDAR_STATE =
  /\b(meetings?|calendar|agenda|schedule|who am i meeting|who am i seeing|am i free|what(?:'s| is) on my (?:calendar|schedule))\b/i;

/** Drive / file personal current-state (shares, personal drive, document currency). */
const PERSONAL_FILE_STATE =
  /\b(files?|documents?|folders?)\b.{0,40}\b(shared|sent|gave)\b|\b(shared|sent|gave)\b.{0,40}\b(files?|documents?)\b|\b(my|our)\s+(files?|documents?|drive)\b|\bwhat files?\b|\b(this|the|that)\s+(document|file|doc)\b.{0,40}\b(last\s+)?(updated|modified|changed|edited)\b|\bwhen was (this|the|that)\s+(document|file|doc)\b/i;

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

  if (PERSONAL_CALENDAR_STATE.test(q)) {
    return true;
  }

  if (PERSONAL_FILE_STATE.test(q)) {
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
