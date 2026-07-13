/**
 * Phase 3 — Correction routing engine (pure).
 * Maps root causes → destinations. Does not mutate runtime or knowledge stores.
 */
import type {
  AICorrectionDestination,
  AICorrectionRoutePlan,
  AIRootCauseCode,
} from 'vssyl-shared';

const ROOT_CAUSE_TO_DESTINATIONS: Record<AIRootCauseCode, AICorrectionDestination[]> = {
  PROVIDER: ['ROUTING_POLICY', 'OPERATOR_TRIAGE'],
  PROMPT: ['PROMPT_POLICY'],
  RETRIEVAL: ['KNOWLEDGE_ENGINE'],
  KNOWLEDGE: ['KNOWLEDGE_ENGINE', 'SOURCE_OF_RECORD_OWNER'],
  CONTEXT: ['PROMPT_POLICY', 'KNOWLEDGE_ENGINE'],
  GROUNDING: ['GROUNDING_POLICY'],
  BUSINESS_DATA: ['BUSINESS_ADMIN', 'SOURCE_OF_RECORD_OWNER'],
  PERSONAL_MEMORY: ['PERSONAL_MEMORY', 'MEMORY_REVIEW'],
  TOOL: ['TOOL_OWNER'],
  APPROVAL: ['APPROVAL_POLICY'],
  AUTHORIZATION: ['AUTHORIZATION_POLICY'],
  SOURCE_OF_RECORD: ['SOURCE_OF_RECORD_OWNER'],
  HALLUCINATION: ['GROUNDING_POLICY', 'PROMPT_POLICY', 'OPERATOR_TRIAGE'],
  MISSING_CONTEXT: ['KNOWLEDGE_ENGINE', 'PROMPT_POLICY'],
  AMBIGUOUS_PROMPT: ['USER_EDUCATION', 'PROMPT_POLICY'],
  USER_ERROR: ['USER_EDUCATION'],
  ROUTING: ['ROUTING_POLICY'],
  OTHER: ['OPERATOR_TRIAGE'],
};

const RATIONALE: Record<AIRootCauseCode, string> = {
  PROVIDER: 'Provider quality or availability issue — review routing policy; do not change Twin Core.',
  PROMPT: 'Prompt construction or policy issue — route to prompt policy owners.',
  RETRIEVAL: 'Wrong or failed retrieval — Knowledge Engine / retrieval config.',
  KNOWLEDGE: 'Knowledge content or selection issue — Knowledge Engine; knowledge stays scoped.',
  CONTEXT: 'Context assembly issue — prompt/context policy and/or Knowledge Engine.',
  GROUNDING: 'Grounding enforcement or evidence gap — grounding policy.',
  BUSINESS_DATA: 'Incorrect business SoR data — business admin / module SoR owner.',
  PERSONAL_MEMORY: 'Incorrect personal memory — personal memory review (never promote globally).',
  TOOL: 'Wrong tool selection or tool failure — tool domain owner.',
  APPROVAL: 'Approval gating issue — approval policy (still via AIActionExecution).',
  AUTHORIZATION: 'AuthZ/membership issue — authorization policy.',
  SOURCE_OF_RECORD: 'Wrong module SoR — route to owning module.',
  HALLUCINATION: 'Ungrounded invention — grounding + prompt; operator triage if systemic.',
  MISSING_CONTEXT: 'Needed context absent — retrieval/context policy.',
  AMBIGUOUS_PROMPT: 'User intent unclear — education and/or prompt clarification patterns.',
  USER_ERROR: 'User misunderstanding — education only; no platform mutation.',
  ROUTING: 'Model/provider routing decision — routing policy (Phase 3 observes only).',
  OTHER: 'Unclassified — operator triage.',
};

/** Label/context heuristics for module-specific destinations (optional overlay). */
export function overlayModuleDestinations(
  plan: AICorrectionRoutePlan,
  hints?: { wrongCalendar?: boolean; wrongDrive?: boolean; wrongChat?: boolean; wrongTodo?: boolean; wrongHr?: boolean }
): AICorrectionRoutePlan {
  if (!hints) return plan;
  const extra: AICorrectionDestination[] = [];
  if (hints.wrongCalendar) extra.push('CALENDAR_MODULE');
  if (hints.wrongDrive) extra.push('DRIVE_MODULE');
  if (hints.wrongChat) extra.push('CHAT_MODULE');
  if (hints.wrongTodo) extra.push('TODO_MODULE');
  if (hints.wrongHr) extra.push('HR_MODULE');
  if (extra.length === 0) return plan;
  const destinations = Array.from(new Set([...plan.destinations, ...extra]));
  return { ...plan, destinations };
}

export function routeCorrectionForRootCause(rootCause: AIRootCauseCode): AICorrectionRoutePlan {
  return {
    rootCause,
    destinations: [...ROOT_CAUSE_TO_DESTINATIONS[rootCause]],
    rationale: RATIONALE[rootCause],
  };
}

export function routeCorrectionsForRootCauses(
  rootCauses: AIRootCauseCode[],
  hints?: Parameters<typeof overlayModuleDestinations>[1]
): AICorrectionRoutePlan[] {
  return rootCauses.map((code) => overlayModuleDestinations(routeCorrectionForRootCause(code), hints));
}

/** Evaluation labels → suggested root causes (operator assist; not auto-applied). */
export function suggestRootCausesFromLabels(
  labels: string[]
): AIRootCauseCode[] {
  const out = new Set<AIRootCauseCode>();
  for (const label of labels) {
    switch (label) {
      case 'UNSAFE':
        out.add('GROUNDING');
        out.add('AUTHORIZATION');
        break;
      case 'INCORRECT':
        out.add('HALLUCINATION');
        out.add('MISSING_CONTEXT');
        break;
      case 'WRONG_SOURCE':
        out.add('SOURCE_OF_RECORD');
        break;
      case 'WRONG_RETRIEVAL':
        out.add('RETRIEVAL');
        break;
      case 'WRONG_TOOL':
        out.add('TOOL');
        break;
      case 'WRONG_MEMORY':
        out.add('PERSONAL_MEMORY');
        break;
      case 'WRONG_REASONING':
        out.add('PROMPT');
        out.add('CONTEXT');
        break;
      case 'WRONG_PERMISSION':
        out.add('AUTHORIZATION');
        break;
      case 'WRONG_BUSINESS_DATA':
        out.add('BUSINESS_DATA');
        break;
      case 'INCOMPLETE':
        out.add('MISSING_CONTEXT');
        break;
      default:
        break;
    }
  }
  return Array.from(out);
}
