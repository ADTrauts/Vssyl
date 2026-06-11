/**
 * Read persisted pipeline trace from AIConversationHistory.context JSON.
 */

import type { AIPipelineTrace } from '../types/pipelineDiagnostics';

function isPipelineTrace(value: unknown): value is AIPipelineTrace {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.traceId === 'string' &&
    typeof t.userId === 'string' &&
    typeof t.userMessage === 'string' &&
    Array.isArray(t.intentDetected)
  );
}

export function extractPipelineTraceFromContext(context: unknown): AIPipelineTrace | null {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
  const record = context as Record<string, unknown>;
  const raw = record._pipelineTrace ?? record.pipelineTrace;
  return isPipelineTrace(raw) ? raw : null;
}
