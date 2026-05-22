import type {
  PipelineLearningRetrieved,
  PipelineLearningStageRecord,
} from '../types/pipelineDiagnostics';

export interface LearningPipelineSnapshot {
  pendingCount: number;
  appliedInferredCount: number;
  contextPreferencesActive: number;
  resolverInferredCount: number;
  avgLearningConfidence?: number;
  collectivePatternsLoaded: number;
  collectiveConsent: boolean;
}

function roundConfidence(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.round(value * 100) / 100;
}

export function buildLearningPipelineTrace(
  snapshot: LearningPipelineSnapshot
): PipelineLearningRetrieved {
  const stages: PipelineLearningStageRecord[] = [
    {
      stage: 'extract',
      status: 'completed',
      details: 'Chat and behavioral signals recorded for learning',
    },
    {
      stage: 'pending',
      status: snapshot.pendingCount > 0 ? 'active' : 'completed',
      count: snapshot.pendingCount,
      details:
        snapshot.pendingCount > 0
          ? `${snapshot.pendingCount} suggestion${snapshot.pendingCount === 1 ? '' : 's'} waiting for your review`
          : 'No suggestions waiting in Learning tab',
    },
    {
      stage: 'promote',
      status: snapshot.appliedInferredCount > 0 ? 'completed' : 'skipped',
      count: snapshot.appliedInferredCount,
      confidence: roundConfidence(snapshot.avgLearningConfidence),
      details:
        snapshot.appliedInferredCount > 0
          ? 'Saved learnings promoted to AI Identity'
          : 'No newly promoted learnings on this turn',
    },
    {
      stage: 'resolver',
      status: snapshot.resolverInferredCount > 0 ? 'completed' : 'skipped',
      count: snapshot.resolverInferredCount,
      confidence: roundConfidence(snapshot.avgLearningConfidence),
      details:
        snapshot.resolverInferredCount > 0
          ? 'Applied learnings included in effective preferences'
          : 'Resolver used defaults and questionnaire only',
    },
  ];

  return {
    stages,
    pendingCount: snapshot.pendingCount,
    appliedCount: snapshot.appliedInferredCount,
    inferredPreferencesUsed: snapshot.resolverInferredCount,
    collectivePatternsUsed: snapshot.collectiveConsent ? snapshot.collectivePatternsLoaded : 0,
    collectiveConsent: snapshot.collectiveConsent,
    avgLearningConfidence: roundConfidence(snapshot.avgLearningConfidence),
  };
}

export function readLearningPipelineSnapshot(
  queryContext: Record<string, unknown> | undefined
): LearningPipelineSnapshot | undefined {
  const raw = queryContext?.learningPipelineSnapshot;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const s = raw as Record<string, unknown>;
  return {
    pendingCount: typeof s.pendingCount === 'number' ? s.pendingCount : 0,
    appliedInferredCount: typeof s.appliedInferredCount === 'number' ? s.appliedInferredCount : 0,
    contextPreferencesActive:
      typeof s.contextPreferencesActive === 'number' ? s.contextPreferencesActive : 0,
    resolverInferredCount:
      typeof s.resolverInferredCount === 'number' ? s.resolverInferredCount : 0,
    avgLearningConfidence:
      typeof s.avgLearningConfidence === 'number' ? s.avgLearningConfidence : undefined,
    collectivePatternsLoaded:
      typeof s.collectivePatternsLoaded === 'number' ? s.collectivePatternsLoaded : 0,
    collectiveConsent: s.collectiveConsent === true,
  };
}
