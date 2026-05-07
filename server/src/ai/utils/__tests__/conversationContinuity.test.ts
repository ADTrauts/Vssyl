import { describe, expect, it } from 'vitest';
import { classifyTopicTransition, updateConversationContinuityState } from '../conversationContinuity';

describe('conversation continuity utilities', () => {
  it('detects continuation for pronoun follow-ups', () => {
    const transition = classifyTopicTransition({
      latestUserMessage: 'Which one seems calmer?',
      previousTopic: {
        label: 'Charleston vs Cancun',
        entities: ['Charleston', 'Cancun'],
        confidence: 0.9,
        updatedAt: new Date().toISOString(),
      },
    });
    expect(transition).toBe('continuation');
  });

  it('detects topic shift for abrupt new domain', () => {
    const transition = classifyTopicTransition({
      latestUserMessage: 'Can you help me draft a hiring policy?',
      previousTopic: {
        label: 'Charleston vs Cancun',
        entities: ['Charleston', 'Cancun'],
        confidence: 0.9,
        updatedAt: new Date().toISOString(),
      },
    });
    expect(transition).toBe('shift');
  });

  it('updates continuity while carrying entities on continuation', () => {
    const updated = updateConversationContinuityState({
      latestUserMessage: 'Which one feels more relaxing?',
      recentMessages: [],
      previousState: {
        currentTopic: 'Charleston vs Cancun',
        activeEntities: ['Charleston', 'Cancun'],
        userGoal: 'make a decision',
        lastUpdatedAt: new Date().toISOString(),
      },
      previousTopic: {
        label: 'Charleston vs Cancun',
        entities: ['Charleston', 'Cancun'],
        userGoal: 'make a decision',
        confidence: 0.8,
        updatedAt: new Date().toISOString(),
      },
    });

    expect(updated.continuity.currentTopic).toBe('Charleston vs Cancun');
    expect(updated.continuity.activeEntities).toEqual(expect.arrayContaining(['Charleston', 'Cancun']));
    expect(updated.activeTopic.confidence).toBeGreaterThan(0.7);
  });
});
