/**
 * Phase 5 — unified evidence bundle for admin inspection.
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import type { StructuredAIResponse } from '../types/structuredResponse';
import type {
  AIPipelineTrace,
  PipelineContextBlockSummary,
  PipelineEvidenceBundle,
  PipelineEvidenceItem,
} from '../types/pipelineDiagnostics';

function mapAssembledEvidence(
  assembled?: AIAssembledContext | Record<string, unknown>
): PipelineEvidenceItem[] {
  if (!assembled || typeof assembled !== 'object') return [];
  const ac = assembled as AIAssembledContext;
  if (!Array.isArray(ac.evidence)) return [];
  return ac.evidence.map((e) => ({
    label: e.label,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    detail: e.detail,
    confidence: e.confidence,
  }));
}

function mapContextBlockSummaries(
  assembled?: AIAssembledContext | Record<string, unknown>
): PipelineContextBlockSummary[] {
  if (!assembled || typeof assembled !== 'object') return [];
  const blocks = (assembled as AIAssembledContext).contextBlocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => ({
    title: b.title,
    sourceType: b.sourceType,
    priority: b.priority,
  }));
}

function mapStructuredEvidence(structured?: StructuredAIResponse | null): PipelineEvidenceItem[] {
  if (!structured?.evidence || !Array.isArray(structured.evidence)) return [];
  return structured.evidence.map((e) => ({
    label: e.label,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    detail: e.detail,
  }));
}

export interface BuildPipelineEvidenceBundleInput {
  trace: AIPipelineTrace;
  assembledContext?: AIAssembledContext | Record<string, unknown>;
  structuredResponse?: StructuredAIResponse | null;
}

export function buildPipelineEvidenceBundle(
  input: BuildPipelineEvidenceBundleInput
): PipelineEvidenceBundle {
  const { trace } = input;
  const learningEvidence: PipelineEvidenceItem[] =
    trace.learningRetrieved?.stages.map((stage) => ({
      label: `Learning ${stage.stage}`,
      sourceType: 'learning',
      detail: stage.details ?? stage.status,
      confidence:
        typeof stage.confidence === 'number' ? String(stage.confidence) : undefined,
    })) ?? [];

  return {
    assembledEvidence: [...learningEvidence, ...mapAssembledEvidence(input.assembledContext)],
    assembledContextBlocks: mapContextBlockSummaries(input.assembledContext),
    assembledUsedModules:
      input.assembledContext && typeof input.assembledContext === 'object'
        ? [...((input.assembledContext as AIAssembledContext).usedModules ?? [])]
        : [],
    structuredEvidence: mapStructuredEvidence(input.structuredResponse ?? undefined),
    structuredConfidence: input.structuredResponse?.confidence
      ? {
          level: input.structuredResponse.confidence.level,
          explanation: input.structuredResponse.confidence.explanation,
        }
      : undefined,
    toolOutputs: [...trace.toolsUsed],
    retrievalRecords: [...trace.contextRetrieved],
    sourcesUsed: [...trace.sourcesUsed],
    memoryRetrieved: { ...trace.memoryRetrieved },
    qualityWarnings: [...trace.qualityWarnings],
  };
}

/** Rebuild bundle from persisted trace when live artifacts are unavailable. */
export function evidenceBundleFromTrace(trace: AIPipelineTrace): PipelineEvidenceBundle {
  if (trace.evidenceBundle) {
    return trace.evidenceBundle;
  }
  return buildPipelineEvidenceBundle({ trace });
}
