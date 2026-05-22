import { describe, expect, it } from 'vitest';
import { buildLearningPipelineTrace } from '../learningPipelineTrace';

describe('buildLearningPipelineTrace', () => {
  it('marks pending stage active when suggestions are waiting', () => {
    const trace = buildLearningPipelineTrace({
      pendingCount: 2,
      appliedInferredCount: 0,
      contextPreferencesActive: 0,
      resolverInferredCount: 0,
      collectivePatternsLoaded: 0,
      collectiveConsent: false,
    });

    expect(trace.stages.find((s) => s.stage === 'pending')?.status).toBe('active');
    expect(trace.pendingCount).toBe(2);
  });

  it('includes resolver confidence when applied learnings exist', () => {
    const trace = buildLearningPipelineTrace({
      pendingCount: 0,
      appliedInferredCount: 1,
      contextPreferencesActive: 1,
      resolverInferredCount: 2,
      avgLearningConfidence: 0.82,
      collectivePatternsLoaded: 0,
      collectiveConsent: false,
    });

    const resolver = trace.stages.find((s) => s.stage === 'resolver');
    expect(resolver?.status).toBe('completed');
    expect(resolver?.confidence).toBe(0.82);
    expect(trace.inferredPreferencesUsed).toBe(2);
  });

  it('does not count collective patterns without consent', () => {
    const trace = buildLearningPipelineTrace({
      pendingCount: 0,
      appliedInferredCount: 0,
      contextPreferencesActive: 0,
      resolverInferredCount: 0,
      collectivePatternsLoaded: 5,
      collectiveConsent: false,
    });

    expect(trace.collectivePatternsUsed).toBe(0);
    expect(trace.collectiveConsent).toBe(false);
  });
});
