/**
 * Admin pipeline intent inference (heuristic, read-only).
 */

import type { PipelineIntentId } from '../types/pipelineDiagnostics';

const LOCAL_DISCOVERY =
  /\b(near me|nearby|in my area|around me|close by|close-by)\b/i;
const LOCAL_DISCOVERY_TOPICS =
  /\b(local\s+)?(clubs?|workshops?|events?|classes?|meetups?|groups?|activities)\b/i;
const LOCAL_DISCOVERY_ADJ = /\blocal\b/i;

const EMOTIONAL_SUPPORT =
  /\b(burned?\s*out|burnt\s*out|burnout|stressed|stress|overwhelmed|anxious|exhausted|need\s+a\s+rest|change\s+of\s+pace|feeling\s+down|i\s+feel\s+like\s+i\s+can'?t)\b/i;

const RECOMMENDATION =
  /\b(what\s+should\s+i|which\s+should\s+i|best\s+\w+|suggest|recommend(?:ation)?s?|any\s+ideas\s+for)\b/i;

const RESEARCH =
  /\b(latest|current|up\s+to\s+date|look\s+up|lookup|search\s+for|verify|fact\s+check|find\s+out\s+if)\b/i;

const TECHNICAL_HELP =
  /\b(typescript|javascript|python|debug|stack\s*trace|error:|repo|repository|pull\s+request|pr\s+#|compile\s+error|runtime\s+error|api\s+route|undefined\s+is\s+not)\b/i;

const PLANNING =
  /\b(plan\s+my|roadmap|next\s+steps?|step\s+by\s+step|implementation\s+plan|schedule\s+my\s+week|milestones?)\b/i;

const PERSONAL_REFLECTION =
  /\b(reflect(?:ing)?\s+on|journal(?:ing)?|thinking\s+about\s+my\s+life|who\s+am\s+i|life\s+direction|values\s+and\s+goals)\b/i;

const BUSINESS_OPERATIONS =
  /\b(business\s+(kpi|metrics|operations)|our\s+team|employees?|workforce|company\s+policy|quarterly\s+results|org\s+chart)\b/i;

const PROJECT_ASSISTANT =
  /\b((this|the|my)\s+project|project\s+(status|overview|context|summary|update)|everything\s+(related|connected)\s+to\s+(this|the|my)\s+project|help\s+me\s+understand\s+(this|the|my)\s+project|what.?s\s+(going\s+on|happening)\s+with\s+(this|the|my)\s+project|all\s+(files|tasks|messages|notes)\s+(for|about|related\s+to)\s+(this|the|my)\s+project|related\s+to\s+(this|the|my)\s+project)\b/i;

const WORKFLOW_ACTION =
  /\b(create\s+a\s+todo|add\s+a\s+task|share\s+(this\s+)?file|schedule\s+a\s+meeting|run\s+this\s+action|execute\s+workflow)\b/i;

function matchesLocalDiscovery(text: string): boolean {
  if (LOCAL_DISCOVERY.test(text)) return true;
  if (LOCAL_DISCOVERY_TOPICS.test(text) && (LOCAL_DISCOVERY.test(text) || LOCAL_DISCOVERY_ADJ.test(text))) {
    return true;
  }
  if (/\b(near me|nearby|in my area|around me)\b/i.test(text) && LOCAL_DISCOVERY_TOPICS.test(text)) {
    return true;
  }
  return false;
}

export function inferPipelineIntents(userMessage: string): PipelineIntentId[] {
  const text = (userMessage || '').trim();
  if (!text) {
    return ['general_chat'];
  }

  const detected: PipelineIntentId[] = [];

  if (matchesLocalDiscovery(text)) detected.push('local_discovery');
  if (EMOTIONAL_SUPPORT.test(text)) detected.push('emotional_support');
  if (RECOMMENDATION.test(text)) detected.push('recommendation');
  if (RESEARCH.test(text)) detected.push('research');
  if (TECHNICAL_HELP.test(text)) detected.push('technical_help');
  if (PLANNING.test(text)) detected.push('planning');
  if (PERSONAL_REFLECTION.test(text)) detected.push('personal_reflection');
  if (BUSINESS_OPERATIONS.test(text)) detected.push('business_operations');
  if (PROJECT_ASSISTANT.test(text)) detected.push('project_assistant');
  if (WORKFLOW_ACTION.test(text)) detected.push('workflow_action');

  if (detected.length === 0) {
    return ['general_chat'];
  }

  return [...new Set(detected)];
}
