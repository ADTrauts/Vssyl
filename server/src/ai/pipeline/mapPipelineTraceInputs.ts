/**
 * Map live orchestration artifacts into buildPipelineTrace input.
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import type { MemoryRetrievalReport } from '../memory/MemoryRetrievalService';
import type {
  BuildPipelineTraceInput,
  LlmProviderRoutingSummary,
  PipelineConfidenceLevel,
  PipelineContextRetrievedRecord,
  PipelineEnforcementAction,
  PipelineLegacySignals,
  PipelineLearningRetrieved,
  PipelineContextDensityReport,
  PipelineMemoryRetrieved,
  PipelineToolUsageRecord,
} from '../types/pipelineDiagnostics';
import {
  buildLearningPipelineTrace,
  readLearningPipelineSnapshot,
} from '../learning/learningPipelineTrace';
import {
  buildOrchestrationDiagnosticsFromQueryContext,
  readContextDensityReport,
} from '../context/contextDensityReport';
import {
  mapVLinkPipelineContextToRetrieved,
  type VLinkPipelineContextResult,
} from '../context/vlinkPipelineContextService';

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
    source:
      e.sourceType === 'vlink'
        ? 'vlink'
        : e.sourceType === 'module'
          ? 'module_context'
          : e.sourceType || 'unknown',
    provider: e.sourceType === 'vlink' ? 'recent_vlinks' : e.label,
    itemCount: 1,
  }));

  const moduleRecords: PipelineContextRetrievedRecord[] = usedModules
    .filter((mod) => mod !== 'vlink')
    .map((mod) => ({
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

export function mapMemoryRetrievalToTrace(
  queryContext?: Record<string, unknown>,
  influencedFactCount?: number
): Partial<PipelineMemoryRetrieved> {
  const ctx = queryContext ?? {};
  const recalled = Array.isArray(ctx.recalledMessages) ? ctx.recalledMessages.length : 0;
  const report = ctx.memoryRetrievalReport as MemoryRetrievalReport | undefined;
  const facts =
    typeof influencedFactCount === 'number'
      ? influencedFactCount
      : Array.isArray(ctx.userMemoryFacts)
        ? ctx.userMemoryFacts.length
        : 0;
  const threadMemory =
    (Array.isArray(ctx.recentConversationMemory) && ctx.recentConversationMemory.length > 0) ||
    Boolean(ctx.conversationId);

  if (!report) {
    return {
      facts,
      recalledMessages: recalled,
      threadMemory,
    };
  }

  return {
    facts,
    recalledMessages: recalled,
    threadMemory,
    factsLoaded: report.factsLoaded,
    factsInfluenced: report.factsInfluenced,
    influencedFactIds: report.influencedFactIds,
    predicateCharsUsed: report.predicateCharsUsed,
    predicateCharBudget: report.predicateCharBudget,
    influenceRecords: report.candidates.map((c) => ({
      factId: c.factId,
      score: c.score,
      reasonCodes: c.reasonCodes,
    })),
  };
}

export function mapOrchestrationToPipelineTraceInput(
  params: MapPipelineTraceParams
): BuildPipelineTraceInput {
  const ctx = params.queryContext ?? {};
  const memoryRetrieved = mapMemoryRetrievalToTrace(ctx);

  const vlinkPipelineContext = ctx.vlinkPipelineContext as VLinkPipelineContextResult | undefined;
  const vlinkRetrieved = mapVLinkPipelineContextToRetrieved(vlinkPipelineContext);

  const contextRetrieved = [
    ...(params.supplementalContextRetrieved ?? []),
    ...vlinkRetrieved,
    ...mapAssembledContextToRetrieved(params.assembledContext),
  ];
  const toolsUsed = [...(params.supplementalToolsUsed ?? []), ...(params.toolsUsed ?? [])];
  const sourcesUsed = [
    ...new Set([
      ...(params.supplementalSourcesUsed ?? []),
      ...(vlinkPipelineContext?.vlinksUsed ? ['vlink'] : []),
      ...mapSourcesUsedFromAssembled(params.assembledContext).filter((s) => s !== 'vlink'),
    ]),
  ];

  const snapshot = readLearningPipelineSnapshot(ctx);
  const learningRetrieved: PipelineLearningRetrieved | undefined = snapshot
    ? buildLearningPipelineTrace(snapshot)
    : undefined;

  const contextDensityBase = readContextDensityReport(ctx);
  const orchestration = buildOrchestrationDiagnosticsFromQueryContext(ctx);
  const contextDensity: PipelineContextDensityReport | undefined = contextDensityBase
    ? {
        ...contextDensityBase,
        ...(orchestration ? { orchestration } : {}),
      }
    : orchestration
      ? {
          providers: {
            attempted: 0,
            succeeded: 0,
            failed: 0,
            cacheHits: 0,
            attempts: [],
          },
          memory: { factsLoaded: 0, factsInjected: 0, recalledMessagesLoaded: 0 },
          modules: {
            contextsLoaded: 0,
            blocksLoaded: 0,
            blocksInjected: 0,
            matchedHighRelevance: 0,
          },
          blocks: {
            loaded: 0,
            afterProfile: 0,
            ranked: 0,
            injected: 0,
            synthetic: 0,
            live: 0,
            profileExcluded: 0,
          },
          tokenBudget: { totalAllocated: 0, totalUsedEstimate: 0, byTier: [] },
          missingContextCount: 0,
          orchestration,
        }
      : undefined;

  const llmRouting = readLlmProviderRoutingFromContext(ctx);

  return {
    userId: params.userId,
    conversationId: params.conversationId,
    userMessage: params.userMessage,
    finalResponse: params.finalResponse,
    legacySignals: params.legacySignals,
    qualityWarnings: params.qualityWarnings,
    toolsUsed,
    contextRetrieved,
    memoryRetrieved,
    learningRetrieved,
    contextDensity,
    sourcesUsed,
    confidenceLevel: numericConfidenceToLevel(params.confidence),
    traceId: params.traceId,
    enforcementApplied: params.enforcementApplied,
    enforcementAction: params.enforcementAction,
    ...(llmRouting && { llmProviderRouting: llmRouting }),
  };
}

function readLlmProviderRoutingFromContext(
  ctx: Record<string, unknown>
): LlmProviderRoutingSummary | undefined {
  const raw = ctx.llmProviderRouting;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  if (typeof record.selectedProvider !== 'string') return undefined;
  return raw as LlmProviderRoutingSummary;
}
