import { describe, expect, it } from 'vitest';
import { buildPipelineEvidenceBundle, evidenceBundleFromTrace } from '../buildPipelineEvidenceBundle';
import { buildPipelineTrace } from '../buildPipelineTrace';

describe('buildPipelineEvidenceBundle', () => {
  const trace = buildPipelineTrace({
    userId: 'user-1',
    userMessage: 'Workshops near me',
    finalResponse: 'Here are some options.',
    toolsUsed: [{ name: 'place_search', round: 0, success: true }],
    contextRetrieved: [{ source: 'vssyl_place', provider: 'place_discoveries', itemCount: 1 }],
  });

  it('merges assembled and structured evidence', () => {
    const bundle = buildPipelineEvidenceBundle({
      trace,
      assembledContext: {
        usedModules: ['place', 'calendar'],
        evidence: [{ label: 'Place overview', sourceType: 'module', confidence: 'high' }],
        contextBlocks: [{ title: 'Place context', sourceType: 'module', priority: 'high', content: {} }],
      },
      structuredResponse: {
        mode: 'answer',
        summary: 'Summary',
        evidence: [{ label: 'User memory', sourceType: 'personal' }],
        confidence: { level: 'medium', explanation: 'Partial context' },
      },
    });

    expect(bundle.assembledEvidence).toHaveLength(1);
    expect(bundle.assembledUsedModules).toEqual(['place', 'calendar']);
    expect(bundle.structuredEvidence).toHaveLength(1);
    expect(bundle.structuredConfidence?.level).toBe('medium');
    expect(bundle.toolOutputs).toHaveLength(1);
    expect(bundle.retrievalRecords).toHaveLength(1);
  });

  it('evidenceBundleFromTrace falls back to trace fields', () => {
    const bundle = evidenceBundleFromTrace(trace);
    expect(bundle.toolOutputs[0]?.name).toBe('place_search');
    expect(bundle.retrievalRecords[0]?.source).toBe('vssyl_place');
  });
});
