/**
 * Query-native discovery signals — intent-first retrieval when user asks to find/locate entities.
 * Wave 3: general_discovery consumer fallback (no module-specific retrieval).
 */

const FIND_VERB =
  /\b(find|search\s+for|look\s+for|look\s+up|locate|show\s+me|where\s+is|where'?s|which\s+\w+\s+(has|have)|open\s+the)\b/i;

const MODULE_ENTITY =
  /\b(file|files|document|documents|spreadsheet|folder|task|tasks|todo|todos|calendar|event|events|meeting|meetings|message|messages|chat|conversation|note|notes|notebook|page|pages|employee|employees|shift|shifts|schedule|schedules|announcement|announcements|communication|communications|campaign|campaigns|policy|handbook)\b/i;

const MODULE_ASSISTANCE =
  /\b(my\s+(file|task|todo|event|meeting|message|note|shift|schedule)|in\s+(drive|chat|calendar|todo|notes|notebook|hr|scheduling))\b/i;

export interface QueryDiscoverySignalResult {
  eligible: boolean;
  signals: string[];
  /** Hints for operator diagnostics — not used to filter search providers. */
  domainHints: string[];
}

export function detectQueryDiscoverySignals(userMessage: string): QueryDiscoverySignalResult {
  const text = (userMessage || '').trim();
  if (text.length < 2) {
    return { eligible: false, signals: [], domainHints: [] };
  }

  const signals: string[] = [];
  const domainHints: string[] = [];

  if (FIND_VERB.test(text)) {
    signals.push('find_verb');
  }
  if (MODULE_ENTITY.test(text)) {
    signals.push('module_entity');
    if (/\b(file|document|spreadsheet|folder)\b/i.test(text)) domainHints.push('drive');
    if (/\b(task|todo)\b/i.test(text)) domainHints.push('todo');
    if (/\b(calendar|event|meeting)\b/i.test(text)) domainHints.push('calendar');
    if (/\b(message|chat|conversation)\b/i.test(text)) domainHints.push('chat');
    if (/\b(note|notebook|page)\b/i.test(text)) domainHints.push('notebook');
    if (/\b(employee|time.?off|onboarding|hr)\b/i.test(text)) domainHints.push('hr');
    if (/\b(shift|schedule)\b/i.test(text)) domainHints.push('scheduling');
    if (/\b(announcement|communication|campaign|policy)\b/i.test(text)) {
      domainHints.push('workforce_comms');
    }
    if (/\b(bookmark|quick\s*note|scratchpad)\b/i.test(text)) domainHints.push('dashboard');
  }
  if (MODULE_ASSISTANCE.test(text)) {
    signals.push('module_assistance');
  }

  const eligible =
    signals.includes('find_verb') &&
    (signals.includes('module_entity') || signals.includes('module_assistance'));

  return { eligible, signals, domainHints: [...new Set(domainHints)] };
}
