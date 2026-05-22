/**
 * Build a read-only AI pipeline diagnostic trace from orchestration inputs.
 */

import { randomUUID } from 'crypto';
import type {
  AIPipelineTrace,
  BuildPipelineTraceInput,
  PipelineCatalog,
  PipelineConfidenceLevel,
  PipelineIntentId,
  PipelineMemoryRetrieved,
} from '../types/pipelineDiagnostics';
import {
  getIntentDefinitionFromCatalog,
  getToolsConsideredForIntentsInCatalog,
  getWeakPhrasesFromCatalog,
  isGroundingRequiredForIntentsInCatalog,
} from './pipelineCatalogDefaults';
import { getPipelineCatalogSync } from './pipelineCatalogService';
import { inferPipelineIntents } from './inferPipelineIntents';

const FINAL_RESPONSE_PREVIEW_MAX = 280;
export const GROUNDING_ISSUE = 'Grounding was required but no retrieval/tool was used.';
const WEAK_PHRASE_ISSUE = 'Response contains generic filler phrases while grounding was required.';

function defaultMemoryRetrieved(
  partial?: Partial<PipelineMemoryRetrieved>
): PipelineMemoryRetrieved {
  return {
    facts: partial?.facts ?? 0,
    recalledMessages: partial?.recalledMessages ?? 0,
    threadMemory: partial?.threadMemory ?? false,
  };
}

function truncatePreview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= FINAL_RESPONSE_PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, FINAL_RESPONSE_PREVIEW_MAX - 1)}…`;
}

function computeRetrievalPerformed(input: BuildPipelineTraceInput): boolean {
  const toolsUsed = input.toolsUsed ?? [];
  if (toolsUsed.length > 0) return true;

  const context = input.contextRetrieved ?? [];
  if (context.some((c) => c.itemCount > 0)) return true;

  const memory = defaultMemoryRetrieved(input.memoryRetrieved);
  if (memory.facts > 0 || memory.recalledMessages > 0 || memory.threadMemory) return true;

  const sources = input.sourcesUsed ?? [];
  if (sources.length > 0) return true;

  return false;
}

function responseContainsWeakPhrase(response: string, catalog: PipelineCatalog): boolean {
  const lower = response.toLowerCase();
  return getWeakPhrasesFromCatalog(catalog).some((phrase) => lower.includes(phrase.toLowerCase()));
}

function filterEnabledIntents(
  intentIds: PipelineIntentId[],
  catalog: PipelineCatalog
): PipelineIntentId[] {
  const enabled = intentIds.filter(
    (id) => getIntentDefinitionFromCatalog(catalog, id)?.enabled !== false
  );
  if (enabled.length > 0) return enabled;
  const general = getIntentDefinitionFromCatalog(catalog, 'general_chat');
  if (general?.enabled !== false) return ['general_chat'];
  return intentIds.length > 0 ? intentIds : ['general_chat'];
}

function inferConfidenceLevel(
  explicit: PipelineConfidenceLevel | undefined,
  retrievalPerformed: boolean,
  groundingRequired: boolean
): PipelineConfidenceLevel {
  if (explicit) return explicit;
  if (groundingRequired && !retrievalPerformed) return 'low';
  if (retrievalPerformed) return 'medium';
  return 'medium';
}

export interface BuildPipelineTraceOptions {
  catalog?: PipelineCatalog;
}

export function buildPipelineTrace(
  input: BuildPipelineTraceInput,
  options?: BuildPipelineTraceOptions
): AIPipelineTrace {
  const catalog = options?.catalog ?? getPipelineCatalogSync();
  const intentDetected = filterEnabledIntents(inferPipelineIntents(input.userMessage), catalog);
  const groundingRequired = isGroundingRequiredForIntentsInCatalog(catalog, intentDetected);
  const toolsConsidered = getToolsConsideredForIntentsInCatalog(catalog, intentDetected);
  const toolsUsed = input.toolsUsed ?? [];
  const contextRetrieved = input.contextRetrieved ?? [];
  const memoryRetrieved = defaultMemoryRetrieved(input.memoryRetrieved);
  const learningRetrieved = input.learningRetrieved;
  const contextDensity = input.contextDensity;
  const sourcesUsed = input.sourcesUsed ?? [];
  const qualityWarnings = input.qualityWarnings ?? [];
  const retrievalPerformed = computeRetrievalPerformed(input);

  const issues: string[] = [];
  let genericResponseRisk = false;

  const needsGroundingRetrieval = intentDetected.some(
    (id) => getIntentDefinitionFromCatalog(catalog, id)?.groundingRequired === true
  );

  if (needsGroundingRetrieval && !retrievalPerformed) {
    genericResponseRisk = true;
    if (!issues.includes(GROUNDING_ISSUE)) {
      issues.push(GROUNDING_ISSUE);
    }
  }

  if (groundingRequired && responseContainsWeakPhrase(input.finalResponse, catalog)) {
    genericResponseRisk = true;
    if (!issues.includes(WEAK_PHRASE_ISSUE)) {
      issues.push(WEAK_PHRASE_ISSUE);
    }
  }

  const confidenceLevel = inferConfidenceLevel(
    input.confidenceLevel,
    retrievalPerformed,
    groundingRequired
  );

  return {
    traceId: input.traceId ?? randomUUID(),
    userId: input.userId,
    conversationId: input.conversationId,
    userMessage: input.userMessage,
    intentDetected,
    legacySignals: input.legacySignals,
    groundingRequired,
    toolsConsidered,
    toolsUsed,
    retrievalPerformed,
    contextRetrieved,
    memoryRetrieved,
    ...(learningRetrieved && { learningRetrieved }),
    ...(contextDensity && { contextDensity }),
    sourcesUsed,
    confidenceLevel,
    genericResponseRisk,
    qualityWarnings,
    issues,
    finalResponsePreview: truncatePreview(input.finalResponse),
    createdAt: input.createdAt ?? new Date().toISOString(),
    enforcementApplied: input.enforcementApplied,
    enforcementAction: input.enforcementAction,
  };
}
