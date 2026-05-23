import { describe, expect, it } from 'vitest';
import {
  mapAssembledContextToRetrieved,
  mapMemoryRetrievalToTrace,
  mapOrchestrationToPipelineTraceInput,
  numericConfidenceToLevel,
} from '../mapPipelineTraceInputs';
import { buildPipelineTrace } from '../buildPipelineTrace';
import { extractPipelineTraceFromContext } from '../extractPipelineTraceFromContext';
import type { AIPipelineTrace } from '../../types/pipelineDiagnostics';

describe('mapPipelineTraceInputs', () => {
  it('maps assembled evidence and modules to contextRetrieved', () => {
    const rows = mapAssembledContextToRetrieved({
      usedModules: ['place', 'calendar'],
      evidence: [{ label: 'Place overview', sourceType: 'module', confidence: 'high' }],
      contextBlocks: [],
    });
    expect(rows.some((r) => r.provider === 'place')).toBe(true);
    expect(rows.some((r) => r.source === 'module_context')).toBe(true);
  });

  it('maps vlink evidence to source vlink (not module_context)', () => {
    const rows = mapAssembledContextToRetrieved({
      usedModules: ['vlink', 'calendar'],
      evidence: [
        {
          label: 'V_Link Relationships',
          sourceType: 'vlink',
          sourceId: 'vlink',
          confidence: 'high',
        },
      ],
      contextBlocks: [],
    });
    expect(rows.some((r) => r.source === 'vlink' && r.provider === 'recent_vlinks')).toBe(true);
    expect(rows.some((r) => r.provider === 'vlink' && r.source === 'module_context')).toBe(false);
  });

  it('includes vlink from query context in orchestration trace input', () => {
    const input = mapOrchestrationToPipelineTraceInput({
      userId: 'u1',
      userMessage: 'What is connected to VL-111111111111?',
      finalResponse: 'Here is what is linked.',
      confidence: 0.8,
      queryContext: {
        vlinkPipelineContext: {
          items: [],
          vlinksConsidered: 1,
          vlinksUsed: 1,
          linkedEntitiesConsidered: 2,
          accessibleLinkedEntities: 1,
          restrictedLinkedEntities: 1,
          suggestionsIgnored: 0,
          querySignals: {
            vlCodeReferenced: true,
            relationshipQuery: true,
            intentBoost: false,
          },
        },
      },
    });
    expect(input.contextRetrieved?.some((r) => r.source === 'vlink')).toBe(true);
    expect(input.sourcesUsed).toContain('vlink');
  });

  it('numericConfidenceToLevel buckets scores', () => {
    expect(numericConfidenceToLevel(0.9)).toBe('high');
    expect(numericConfidenceToLevel(0.7)).toBe('medium');
    expect(numericConfidenceToLevel(0.4)).toBe('low');
  });

  it('mapMemoryRetrievalToTrace includes influence ids from report', () => {
    const mapped = mapMemoryRetrievalToTrace({
      userMemoryFacts: [{ id: 'f1' }],
      memoryRetrievalReport: {
        factsLoaded: 10,
        factsInfluenced: 1,
        factIds: ['f1', 'f2'],
        influencedFactIds: ['f1'],
        predicateCharsUsed: 42,
        predicateCharBudget: 600,
        isRecallQuery: false,
        candidates: [{ factId: 'f1', score: 0.8, reasonCodes: ['explicit_boost'] }],
      },
    });
    expect(mapped.factsLoaded).toBe(10);
    expect(mapped.factsInfluenced).toBe(1);
    expect(mapped.influencedFactIds).toEqual(['f1']);
    expect(mapped.influenceRecords?.[0]?.factId).toBe('f1');
  });
});

describe('extractPipelineTraceFromContext', () => {
  it('reads embedded _pipelineTrace from history context', () => {
    const trace: AIPipelineTrace = buildPipelineTrace({
      userId: 'u1',
      userMessage: 'clubs near me',
      finalResponse: 'try meetup',
    });
    const extracted = extractPipelineTraceFromContext({ _pipelineTrace: trace, foo: 'bar' });
    expect(extracted?.traceId).toBe(trace.traceId);
    expect(extracted?.intentDetected).toContain('local_discovery');
  });
});

describe('buildPipelineTrace with orchestration mapping', () => {
  it('marks retrieval when tools were used', () => {
    const trace = buildPipelineTrace(
      mapOrchestrationToPipelineTraceInput({
        userId: 'u1',
        userMessage: 'list my drive files',
        finalResponse: 'here are your files',
        confidence: 0.8,
        toolsUsed: [{ name: 'list_drive_files', round: 1, success: true }],
      })
    );
    expect(trace.retrievalPerformed).toBe(true);
    expect(trace.toolsUsed).toHaveLength(1);
  });
});
