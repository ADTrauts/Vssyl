/**
 * Align admin diagnostics with canonical persisted twin context fields.
 */

import type { AIPipelineTrace, PipelineConversationReasoningSummary } from '../types/pipelineDiagnostics';
import { extractPipelineTraceFromContext } from './extractPipelineTraceFromContext';

function readConversationReasoning(
  context: Record<string, unknown>
): PipelineConversationReasoningSummary | undefined {
  const raw = context._conversationReasoning ?? context.conversationReasoning;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const summary: PipelineConversationReasoningSummary = {};
  if (typeof record.conversationObjective === 'string') {
    summary.conversationObjective = record.conversationObjective;
  }
  if (typeof record.understandingConfidence === 'number') {
    summary.understandingConfidence = record.understandingConfidence;
  }
  if (typeof record.prematureSolutionRisk === 'boolean') {
    summary.prematureSolutionRisk = record.prematureSolutionRisk;
  }
  if (typeof record.recommendedResponseAction === 'string') {
    summary.recommendedResponseAction = record.recommendedResponseAction;
  }
  return Object.keys(summary).length > 0 ? summary : undefined;
}

export function mergeDiagnosticsFromHistoryContext(
  trace: AIPipelineTrace,
  context: unknown
): AIPipelineTrace {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return trace;
  const record = context as Record<string, unknown>;
  const reasoning = readConversationReasoning(record);
  if (!reasoning) return trace;
  return { ...trace, conversationReasoning: reasoning };
}

export function extractCanonicalPipelineTraceFromHistoryContext(
  context: unknown
): AIPipelineTrace | null {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
  const record = context as Record<string, unknown>;
  const embedded = extractPipelineTraceFromContext(context);
  if (!embedded) return null;
  return mergeDiagnosticsFromHistoryContext(embedded, record);
}
