/**
 * Map live orchestration artifacts into buildPipelineTrace input.
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import type {
  BuildPipelineTraceInput,
  PipelineConfidenceLevel,
  PipelineContextRetrievedRecord,
  PipelineEnforcementAction,
  PipelineLegacySignals,
  PipelineToolUsageRecord,
} from '../types/pipelineDiagnostics';

export function numericConfidenceToLevel(confidence: number): PipelineConfidenceLevel {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

export function mapAssembledContextToRetrieved(
  assembled?: AIAssembledContext | Record<string, unknown>
): PipelineContextRetrievedRecord[] {
  if (!assembled || typeof assembled !== 'object') return [];

  const ac = assembled as AIAssembledContext;
  const evidence = Array.isArray(ac.evidence) ? ac.evidence : [];
  const usedModules = Array.isArray(ac.usedModules) ? ac.usedModules : [];

  const fromEvidence: PipelineContextRetrievedRecord[] = evidence.map((e) => ({
    source: e.sourceType || 'unknown',
    provider: e.label,
    itemCount: 1,
  }));

  const moduleRecords: PipelineContextRetrievedRecord[] = usedModules.map((mod) => ({
    source: 'module_context',
    provider: mod,
    itemCount: 1,
  }));

  const contextBlocks = Array.isArray(ac.contextBlocks) ? ac.contextBlocks : [];
  if (contextBlocks.length > 0 && fromEvidence.length === 0 && moduleRecords.length === 0) {
    return [{ source: 'context_blocks', itemCount: contextBlocks.length }];
  }

  return [...fromEvidence, ...moduleRecords];
}

export function mapSourcesUsedFromAssembled(
  assembled?: AIAssembledContext | Record<string, unknown>
): string[] {
  if (!assembled || typeof assembled !== 'object') return [];
  const sources = new Set<string>();
  const ac = assembled as AIAssembledContext;
  for (const mod of ac.usedModules ?? []) {
    if (typeof mod === 'string' && mod.trim()) sources.add(mod);
  }
  for (const e of ac.evidence ?? []) {
    if (e.sourceType) sources.add(e.sourceType);
    if (e.label) sources.add(e.label);
  }
  return [...sources];
}

export interface MapPipelineTraceParams {
  userId: string;
  conversationId?: string;
  userMessage: string;
  finalResponse: string;
  confidence: number;
  assembledContext?: AIAssembledContext | Record<string, unknown>;
  legacySignals?: PipelineLegacySignals;
  qualityWarnings?: string[];
  toolsUsed?: PipelineToolUsageRecord[];
  supplementalToolsUsed?: PipelineToolUsageRecord[];
  supplementalContextRetrieved?: PipelineContextRetrievedRecord[];
  supplementalSourcesUsed?: string[];
  queryContext?: Record<string, unknown>;
  traceId?: string;
  enforcementApplied?: boolean;
  enforcementAction?: PipelineEnforcementAction;
}

export function mapOrchestrationToPipelineTraceInput(
  params: MapPipelineTraceParams
): BuildPipelineTraceInput {
  const ctx = params.queryContext ?? {};
  const recalled = Array.isArray(ctx.recalledMessages) ? ctx.recalledMessages.length : 0;
  const facts = Array.isArray(ctx.userMemoryFacts) ? ctx.userMemoryFacts.length : 0;
  const threadMemory =
    (Array.isArray(ctx.recentConversationMemory) && ctx.recentConversationMemory.length > 0) ||
    Boolean(params.conversationId);

  const contextRetrieved = [
    ...(params.supplementalContextRetrieved ?? []),
    ...mapAssembledContextToRetrieved(params.assembledContext),
  ];
  const toolsUsed = [...(params.supplementalToolsUsed ?? []), ...(params.toolsUsed ?? [])];
  const sourcesUsed = [
    ...new Set([
      ...(params.supplementalSourcesUsed ?? []),
      ...mapSourcesUsedFromAssembled(params.assembledContext),
    ]),
  ];

  return {
    userId: params.userId,
    conversationId: params.conversationId,
    userMessage: params.userMessage,
    finalResponse: params.finalResponse,
    legacySignals: params.legacySignals,
    qualityWarnings: params.qualityWarnings,
    toolsUsed,
    contextRetrieved,
    memoryRetrieved: {
      facts,
      recalledMessages: recalled,
      threadMemory,
    },
    sourcesUsed,
    confidenceLevel: numericConfidenceToLevel(params.confidence),
    traceId: params.traceId,
    enforcementApplied: params.enforcementApplied,
    enforcementAction: params.enforcementAction,
  };
}
