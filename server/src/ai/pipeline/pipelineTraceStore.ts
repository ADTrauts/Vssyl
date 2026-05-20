/**
 * In-memory store for admin test-lab pipeline traces (Phase 1; DB in Phase 2).
 */

import type { AIPipelineTrace } from '../types/pipelineDiagnostics';

const MAX_TRACES = 500;
const traceById = new Map<string, AIPipelineTrace>();

export function savePipelineTrace(trace: AIPipelineTrace): void {
  traceById.set(trace.traceId, trace);
  if (traceById.size > MAX_TRACES) {
    const oldest = traceById.keys().next().value;
    if (oldest) traceById.delete(oldest);
  }
}

export function getPipelineTraceById(traceId: string): AIPipelineTrace | undefined {
  return traceById.get(traceId);
}

export function listPipelineTraces(options?: {
  limit?: number;
  userId?: string;
}): AIPipelineTrace[] {
  const limit = Math.min(options?.limit ?? 50, 100);
  let traces = [...traceById.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (options?.userId) {
    traces = traces.filter((t) => t.userId === options.userId);
  }
  return traces.slice(0, limit);
}

export function clearPipelineTraceStore(): void {
  traceById.clear();
}
