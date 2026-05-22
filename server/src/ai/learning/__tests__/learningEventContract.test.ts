import { describe, expect, it } from 'vitest';
import {
  buildDerivedLearningEventWrite,
  buildPrimaryLearningEventWrite,
  parsePatternArtifact,
  readLearningEventArtifact,
} from '../learningEventContract';
import { LEARNING_EVENT_TYPES } from '../learningProposalTypes';

describe('learningEventContract', () => {
  it('buildPrimaryLearningEventWrite stores artifact envelope and summary', () => {
    const write = buildPrimaryLearningEventWrite({
      userId: 'u1',
      eventType: LEARNING_EVENT_TYPES.INTERACTION,
      context: 'chat',
      data: { request: { query: 'Help me plan a trip to Charleston' } },
      confidence: 0.6,
    });

    expect(write.eventType).toBe('interaction');
    expect(write.newBehavior).toContain('Charleston');
    expect(write.applied).toBe(false);
    expect(write.validated).toBe(false);

    const envelope = write.patternData as { artifact?: unknown; schemaVersion?: number };
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.artifact).toBeTruthy();
  });

  it('buildDerivedLearningEventWrite normalizes legacy pattern type', () => {
    const write = buildDerivedLearningEventWrite({
      userId: 'u1',
      eventType: 'pattern',
      contextKey: 'derived:pattern:temporal:peak_hours',
      dedupeKey: 'pattern:temporal:peak_hours',
      artifact: { patternType: 'temporal', confidence: 0.8 },
      summary: 'Temporal pattern detected',
      confidence: 0.8,
    });

    expect(write.eventType).toBe(LEARNING_EVENT_TYPES.PATTERN_DISCOVERY);
    expect(write.context).toBe('derived:pattern:temporal:peak_hours');
  });

  it('parsePatternArtifact reads artifact from patternData envelope', () => {
    const artifact = {
      id: 'p1',
      userId: 'u1',
      patternType: 'behavioral',
      confidence: 0.9,
      strength: 0.7,
      frequency: 3,
      lastObserved: '2026-05-21T12:00:00.000Z',
      data: { activeModules: [['chat', 5]] },
      predictions: [],
    };

    const parsed = parsePatternArtifact({
      id: 'row-1',
      userId: 'u1',
      newBehavior: 'behavioral pattern (90% confidence)',
      patternData: { artifact, schemaVersion: 1 },
      confidence: 0.9,
      frequency: 3,
      createdAt: new Date('2026-05-21T12:00:00.000Z'),
    });

    expect(parsed?.patternType).toBe('behavioral');
    expect(parsed?.confidence).toBe(0.9);
    expect(readLearningEventArtifact({ newBehavior: '{}', patternData: { artifact } })).toEqual(
      artifact
    );
  });

  it('parsePatternArtifact falls back to newBehavior JSON', () => {
    const parsed = parsePatternArtifact({
      id: 'row-2',
      userId: 'u1',
      newBehavior: JSON.stringify({
        id: 'legacy',
        userId: 'u1',
        patternType: 'preference',
        confidence: 0.75,
        strength: 0.5,
        frequency: 2,
        lastObserved: '2026-05-20T12:00:00.000Z',
        data: {},
        predictions: [],
      }),
      patternData: null,
      confidence: 0.75,
      frequency: 2,
      createdAt: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(parsed?.patternType).toBe('preference');
    expect(parsed?.id).toBe('legacy');
  });
});
