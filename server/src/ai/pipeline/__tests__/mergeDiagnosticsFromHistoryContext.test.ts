import { describe, expect, it } from 'vitest';
import type { AIPipelineTrace } from '../../types/pipelineDiagnostics';
import {
  extractCanonicalPipelineTraceFromHistoryContext,
  mergeDiagnosticsFromHistoryContext,
} from '../mergeDiagnosticsFromHistoryContext';

const baseTrace: AIPipelineTrace = {
  traceId: 'trace-1',
  userId: 'user-1',
  userMessage: 'hello',
  intentDetected: ['general_chat'],
  groundingRequired: false,
  toolsConsidered: [],
  toolsUsed: [],
  retrievalPerformed: false,
  contextRetrieved: [],
  memoryRetrieved: { facts: 0, recalledMessages: 0, threadMemory: false },
  sourcesUsed: [],
  confidenceLevel: 'medium',
  genericResponseRisk: false,
  qualityWarnings: [],
  issues: [],
  finalResponsePreview: 'Hi',
  createdAt: new Date().toISOString(),
};

describe('mergeDiagnosticsFromHistoryContext', () => {
  it('merges _conversationReasoning from history context onto trace', () => {
    const merged = mergeDiagnosticsFromHistoryContext(baseTrace, {
      _pipelineTrace: baseTrace,
      _conversationReasoning: {
        conversationObjective: 'explore',
        understandingConfidence: 42,
        prematureSolutionRisk: true,
        recommendedResponseAction: 'probe',
      },
    });

    expect(merged.conversationReasoning).toEqual({
      conversationObjective: 'explore',
      understandingConfidence: 42,
      prematureSolutionRisk: true,
      recommendedResponseAction: 'probe',
    });
  });

  it('extractCanonicalPipelineTraceFromHistoryContext reads _pipelineTrace and reasoning', () => {
    const extracted = extractCanonicalPipelineTraceFromHistoryContext({
      _pipelineTrace: baseTrace,
      conversationReasoning: {
        conversationObjective: 'decide',
        understandingConfidence: 80,
      },
    });

    expect(extracted?.traceId).toBe('trace-1');
    expect(extracted?.conversationReasoning?.conversationObjective).toBe('decide');
    expect(extracted?.conversationReasoning?.understandingConfidence).toBe(80);
  });

  it('reads legacy pipelineTrace key', () => {
    const extracted = extractCanonicalPipelineTraceFromHistoryContext({
      pipelineTrace: baseTrace,
    });
    expect(extracted?.traceId).toBe('trace-1');
  });
});
