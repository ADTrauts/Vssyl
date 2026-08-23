/**
 * Bounded P2: escape residual `answer` mode into neutral informational conversation
 * when the request does not need live/platform data or action execution.
 *
 * P3: authoritative-context detection lives in requiresAuthoritativeContext.ts;
 * this file only decides informational escape eligibility.
 */

import { detectConversationObjective } from '../conversation/conversationObjective';
import type { ConversationObjective } from '../conversation/conversationTypes';
import { isInformationalExplanationQuery } from '../prompts/conversationCoachingProfile';
import { inferPipelineIntents } from '../pipeline/inferPipelineIntents';
import type { AIResponseMode } from '../types/structuredResponse';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from './requiresAuthoritativeContext';

const PIPELINE_BLOCK_ESCAPE = new Set([
  'workflow_action',
  'business_operations',
  'local_discovery',
  'project_assistant',
]);

export interface InformationalAnswerEscapeInput {
  query: string;
  /** Mode after normal structured inference, before this escape. */
  provisionalMode: AIResponseMode;
  conversationObjective?: ConversationObjective;
  fileIds?: unknown;
  businessId?: string | null;
  currentModule?: string | null;
  hasAttachedFiles?: boolean;
}

function hasGroundingOrActionSignals(input: InformationalAnswerEscapeInput): boolean {
  if (isActionMutationRequest(input.query)) {
    return true;
  }

  if (
    requiresAuthoritativeContext({
      query: input.query,
      fileIds: input.fileIds,
      businessId: input.businessId,
      currentModule: input.currentModule,
      hasAttachedFiles: input.hasAttachedFiles,
    })
  ) {
    return true;
  }

  const pipelineIntents = inferPipelineIntents(input.query);
  if (pipelineIntents.some((id) => PIPELINE_BLOCK_ESCAPE.has(id))) {
    return true;
  }

  return false;
}

/**
 * Whether residual `answer` mode should use the P1 informational conversation path.
 */
export function shouldUseInformationalAnswerEscape(
  input: InformationalAnswerEscapeInput
): boolean {
  if (input.provisionalMode !== 'answer') {
    return false;
  }

  const objective =
    input.conversationObjective ?? detectConversationObjective(input.query);

  if (objective === 'execute' || objective === 'decide' || objective === 'plan') {
    return false;
  }

  const informational =
    objective === 'learn' || isInformationalExplanationQuery(input.query);
  if (!informational) {
    return false;
  }

  if (hasGroundingOrActionSignals(input)) {
    return false;
  }

  return true;
}
