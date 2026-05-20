import { describe, expect, it } from 'vitest';
import { buildPipelineTrace, GROUNDING_ISSUE } from '../buildPipelineTrace';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import {
  buildContextUsedRows,
  buildFailureCategories,
  buildFlagReasons,
  buildPipelineTraceInsights,
  deriveReasoningDepth,
} from '../pipelineTraceInsights';

describe('pipelineTraceInsights', () => {
  const catalog = getDefaultPipelineCatalog();

  it('local discovery + no retrieval => LOW depth + grounding failure', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'Any yoga clubs near me?',
        finalResponse: 'You might try searching online for local options.',
      },
      { catalog }
    );

    const insights = buildPipelineTraceInsights(trace, catalog);
    expect(insights.reasoningDepth).toBe('LOW');
    expect(insights.failureCategories).toContain('GROUNDING_FAILURE');
    expect(insights.failureCategories).toContain('RETRIEVAL_FAILURE');
    expect(insights.flagReasons.some((r) => r.includes('Local discovery'))).toBe(true);
    expect(trace.issues).toContain(GROUNDING_ISSUE);
  });

  it('retrieval + tool use => HIGH depth', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'Workshops near me',
        finalResponse: 'Based on Place listings, here are three options.',
        toolsUsed: [{ name: 'place_search', round: 1, success: true }],
        contextRetrieved: [
          { source: 'vssyl_place', provider: 'place', itemCount: 3 },
          { source: 'module_context', provider: 'calendar', itemCount: 1 },
        ],
        memoryRetrieved: { facts: 1, recalledMessages: 0, threadMemory: false },
        retrievalPerformed: true,
        confidenceLevel: 'high',
      },
      { catalog }
    );

    const depth = deriveReasoningDepth(trace, {
      assembledEvidence: [{ label: 'Place hit' }],
      assembledContextBlocks: [],
      assembledUsedModules: ['place'],
      structuredEvidence: [],
      toolOutputs: trace.toolsUsed,
      retrievalRecords: trace.contextRetrieved,
      sourcesUsed: ['place'],
      memoryRetrieved: trace.memoryRetrieved,
      qualityWarnings: [],
    });

    expect(depth).toBe('HIGH');
    expect(buildFailureCategories(trace)).not.toContain('GROUNDING_FAILURE');
  });

  it('partial memory-only => MEDIUM', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'What do you know about my goals?',
        finalResponse: 'You mentioned wanting more balance last week.',
        memoryRetrieved: { facts: 2, recalledMessages: 1, threadMemory: true },
      },
      { catalog }
    );

    expect(deriveReasoningDepth(trace)).toBe('MEDIUM');
    expect(buildFailureCategories(trace)).not.toContain('MISSING_CONTEXT');
  });

  it('web_search source => planned or disabled', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'Latest news near me',
        finalResponse: 'Here is a summary.',
      },
      { catalog }
    );

    const webRow = buildContextUsedRows(trace, catalog).find((r) => r.id === 'web_search');
    expect(webRow).toBeDefined();
    expect(['planned', 'disabled']).toContain(webRow?.status);
  });

  it('generic response => GENERIC_RESPONSE category', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'Clubs near me this weekend',
        finalResponse: 'You might want to consider checking local listings for options.',
      },
      { catalog }
    );

    expect(trace.genericResponseRisk).toBe(true);
    expect(buildFailureCategories(trace)).toContain('GENERIC_RESPONSE');
    const reasons = buildFlagReasons(trace, catalog);
    expect(reasons.some((r) => r.includes('Weak generic phrase'))).toBe(true);
  });

  it('missing context => MISSING_CONTEXT when no retrieval/tools/memory', () => {
    const trace = buildPipelineTrace(
      {
        userId: 'u1',
        userMessage: 'Hello',
        finalResponse: 'Hi there!',
      },
      { catalog }
    );

    expect(buildFailureCategories(trace)).toContain('MISSING_CONTEXT');
  });
});
