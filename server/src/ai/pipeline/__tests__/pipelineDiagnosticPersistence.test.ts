import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  shouldPersistPipelineDiagnostic,
  traceToPersistedFields,
} from '../pipelineDiagnosticPersistence';
import type { AIPipelineTrace } from '../../types/pipelineDiagnostics';

const sampleTrace: AIPipelineTrace = {
  traceId: 'trace-abc',
  userId: 'user-1',
  userMessage: 'clubs near me',
  intentDetected: ['local_discovery'],
  groundingRequired: true,
  toolsConsidered: ['location', 'place_search'],
  toolsUsed: [],
  retrievalPerformed: false,
  contextRetrieved: [],
  memoryRetrieved: { facts: 0, recalledMessages: 0, threadMemory: false },
  sourcesUsed: [],
  confidenceLevel: 'low',
  genericResponseRisk: true,
  qualityWarnings: [],
  issues: ['Grounding was required but no retrieval/tool was used.'],
  finalResponsePreview: 'You may want to check local listings.',
  createdAt: new Date().toISOString(),
};

describe('shouldPersistPipelineDiagnostic', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('skips admin dry-run unless forced', () => {
    expect(shouldPersistPipelineDiagnostic({ adminDryRun: true })).toBe(false);
    expect(shouldPersistPipelineDiagnostic({ adminDryRun: true, force: true })).toBe(true);
  });

  it('respects AI_PIPELINE_DIAGNOSTICS_ENABLED=false', () => {
    process.env.AI_PIPELINE_DIAGNOSTICS_ENABLED = 'false';
    expect(shouldPersistPipelineDiagnostic()).toBe(false);
  });

  it('respects zero sample rate', () => {
    process.env.AI_PIPELINE_DIAGNOSTIC_SAMPLE_RATE = '0';
    expect(shouldPersistPipelineDiagnostic()).toBe(false);
  });
});

describe('traceToPersistedFields', () => {
  it('maps trace fields for Prisma write', () => {
    const fields = traceToPersistedFields(sampleTrace);
    expect(fields.id).toBe('trace-abc');
    expect(fields.userId).toBe('user-1');
    expect(fields.genericResponseRisk).toBe(true);
    expect(fields.intentDetected).toContain('local_discovery');
    expect(Array.isArray(fields.issues)).toBe(true);
  });
});
