import { describe, expect, it } from 'vitest';
import { buildThreadSummaryFromContinuity } from '../aiConversationMemoryService';
import type { ActiveTopicState, ConversationContinuityState } from '../../ai/utils/conversationContinuity';

describe('buildThreadSummaryFromContinuity', () => {
  it('rolls up topic, constraints, and assistant summary', () => {
    const continuity: ConversationContinuityState = {
      currentTopic: 'Trip planning',
      narrowingConstraints: ['domestic / US only', 'warm weather'],
      lastAssistantTurnSummary: 'Charleston and Savannah are strong domestic options.',
      lastUpdatedAt: new Date().toISOString(),
    };
    const activeTopic: ActiveTopicState = {
      label: 'Trip planning',
      entities: ['Charleston', 'Savannah'],
      domain: 'travel',
      confidence: 0.9,
      updatedAt: new Date().toISOString(),
    };
    const summary = buildThreadSummaryFromContinuity({
      continuity,
      activeTopic,
      lastUserSnippet: 'How about domestic trips?',
    });
    expect(summary).toContain('Trip planning');
    expect(summary).toContain('domestic');
    expect(summary).toContain('Charleston');
  });
});
