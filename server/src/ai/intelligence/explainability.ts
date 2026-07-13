/**
 * Phase 3 — Explainability builder (architecture decisions only; no private CoT).
 */
import type {
  AIExecutionExplanation,
  AIExecutionRecordSnapshot,
} from 'vssyl-shared';

export function buildExecutionExplanation(
  record: AIExecutionRecordSnapshot,
  extras?: {
    sourcesUsed?: string[];
    toolsUsed?: string[];
    whyToolNotUsed?: string[];
    whyMemoryNotUsed?: string[];
    whyApprovalRequired?: string[];
    whyProviderSelected?: string;
    groundingNotes?: string[];
  }
): AIExecutionExplanation {
  const toolsFromTimeline = record.timeline
    .filter((e) => e.stage === 'TOOL_PROPOSED')
    .flatMap((e) => {
      const tools = e.detail?.tools;
      return Array.isArray(tools) ? (tools as string[]) : [];
    });

  const whyApprovalRequired =
    extras?.whyApprovalRequired ??
    (record.timeline.some((e) => e.stage === 'APPROVAL')
      ? [
          'A mutating or high-risk tool was proposed; Phase 1/2 governance required human approval before AIActionExecution completed.',
        ]
      : undefined);

  return {
    executionRecordId: record.id,
    whyThisAnswer:
      'This response was produced by the canonical Twin (or linked surface) path using configured context, retrieval, and provider selection. Explainability reports architecture decisions and linked artifacts — not private model chain-of-thought.',
    sourcesUsed: extras?.sourcesUsed ?? [],
    toolsUsed: extras?.toolsUsed ?? toolsFromTimeline,
    whyToolNotUsed: extras?.whyToolNotUsed,
    whyMemoryNotUsed: extras?.whyMemoryNotUsed,
    whyApprovalRequired,
    whyProviderSelected:
      extras?.whyProviderSelected ??
      (record.provider
        ? `Provider ${record.provider}${record.model ? ` / model ${record.model}` : ''} was recorded on the execution (existing routing; Phase 3 observes only).`
        : 'Provider not recorded on this execution record.'),
    groundingNotes: extras?.groundingNotes,
    excludesPrivateReasoning: true,
  };
}
