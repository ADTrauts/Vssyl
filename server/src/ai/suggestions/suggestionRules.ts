/**
 * Correlation rule registry — deterministic v1 rules (Phase 5B–5C).
 */

import {
  CORRELATION_RULE_IDS,
  SUGGESTION_TYPES,
} from './suggestionTypes';
import type { SuggestionRuleDefinition } from './suggestionRuleTypes';
import { evaluateDocumentUploadRule } from './rules/documentUploadRule';
import { evaluateMeetingPrepRule } from './rules/meetingPrepRule';
import { evaluateFileAfterChatRule } from './rules/fileAfterChatRule';
import { evaluateThreadSummaryRule } from './rules/threadSummaryRule';

export type { SuggestionCandidate, SuggestionRuleContext } from './suggestionRuleTypes';

export const SUGGESTION_RULES: SuggestionRuleDefinition[] = [
  {
    id: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
    triggerEventTypes: ['file.uploaded'],
    minConfidence: 0.65,
    evaluate: evaluateDocumentUploadRule,
  },
  {
    id: CORRELATION_RULE_IDS.MEETING_PREP_V1,
    triggerEventTypes: ['file.uploaded', 'calendar.event.created'],
    minConfidence: 0.7,
    evaluate: evaluateMeetingPrepRule,
  },
  {
    id: CORRELATION_RULE_IDS.FILE_AFTER_CHAT_V1,
    triggerEventTypes: ['file.uploaded', 'chat.message.sent'],
    minConfidence: 0.65,
    evaluate: evaluateFileAfterChatRule,
  },
  {
    id: CORRELATION_RULE_IDS.THREAD_ACTIVITY_SPIKE_V1,
    triggerEventTypes: ['chat.message.sent'],
    minConfidence: 0.65,
    evaluate: evaluateThreadSummaryRule,
  },
];

export function rulesForEventType(eventType: string): SuggestionRuleDefinition[] {
  return SUGGESTION_RULES.filter((rule) => rule.triggerEventTypes.includes(eventType));
}

export { SUGGESTION_TYPES, CORRELATION_RULE_IDS };
