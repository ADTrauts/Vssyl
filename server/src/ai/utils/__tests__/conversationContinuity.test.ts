import { describe, expect, it } from 'vitest';
import {
  buildConversationThreadHints,
  classifyTopicTransition,
  formatConversationTranscript,
  updateConversationContinuityState,
} from '../conversationContinuity';
import type { ConversationHistoryItem } from '../../core/DigitalLifeTwinCore';
import { buildProviderUserPrompt } from '../../prompts/providerUserPrompt';
import { inferStructuredResponseMode } from '../structuredResponseMode';

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

  it('detects continuation when user narrows to domestic US travel', () => {
    const transition = classifyTopicTransition({
      latestUserMessage: 'How about non-international trips. Trips within the United States.',
      previousTopic: {
        label: 'Trip planning',
        domain: 'travel',
        entities: [],
        confidence: 0.85,
        updatedAt: new Date().toISOString(),
      },
      recentMessages: [
        { role: 'user', content: 'I want to go on a last minute vacation.' },
        { role: 'assistant', content: 'A last-minute trip is doable — I would start with drivable options.' },
      ],
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

describe('multi-turn vacation conversation', () => {
  const turn1User = 'I want to go on a last minute vacation.';
  const turn1Assistant =
    'A last-minute trip is totally doable — I would keep it simple and look at drivable long weekends first.';

  function historyThroughTurn(turn: 1 | 2 | 3): ConversationHistoryItem[] {
    const base: ConversationHistoryItem[] = [
      { role: 'user', content: turn1User },
      { role: 'assistant', content: turn1Assistant },
    ];
    if (turn === 1) return base;
    base.push({ role: 'user', content: 'How about domestic trips?' });
    base.push({
      role: 'assistant',
      content: 'Got it — staying in the US narrows things a lot. I would compare Charleston, Savannah, and Tampa.',
    });
    if (turn === 2) return base;
    base.push({ role: 'user', content: 'I kind of want warm weather and good food.' });
    return base;
  }

  it('turn 2: domestic refinement continues travel thread and accumulates constraints', () => {
    const history = historyThroughTurn(2);
    const hints = buildConversationThreadHints({
      latestUserMessage: 'How about domestic trips?',
      recentMessages: history,
      continuity: updateConversationContinuityState({
        latestUserMessage: turn1User,
        recentMessages: history.slice(0, 2),
      }).continuity,
      activeTopic: {
        label: 'Trip planning',
        domain: 'travel',
        entities: [],
        confidence: 0.85,
        updatedAt: new Date().toISOString(),
      },
    });

    expect(hints.momentum).toBe('continue');
    expect(hints.narrowingConstraints).toContain('domestic / US only');
    expect(hints.threadSummary).toMatch(/continue|narrow/i);
    expect(hints.isFollowUp).toBe(true);
  });

  it('turn 3: warm weather and food constraints accumulate', () => {
    const history = historyThroughTurn(3);
    const { continuity, activeTopic } = updateConversationContinuityState({
      latestUserMessage: 'I kind of want warm weather and good food.',
      recentMessages: history,
      previousState: updateConversationContinuityState({
        latestUserMessage: 'How about domestic trips?',
        recentMessages: history.slice(0, 4),
      }).continuity,
      previousTopic: {
        label: 'Trip planning',
        domain: 'travel',
        entities: [],
        confidence: 0.88,
        updatedAt: new Date().toISOString(),
      },
    });

    expect(activeTopic.domain).toBe('travel');
    expect(continuity.narrowingConstraints).toEqual(
      expect.arrayContaining(['domestic / US only', 'warm weather', 'good food'])
    );
  });

  it('provider user prompt includes thread transcript for conversation follow-up', () => {
    const history = historyThroughTurn(2);
    const hints = buildConversationThreadHints({
      latestUserMessage: 'How about domestic trips?',
      recentMessages: history,
    });
    const prompt = buildProviderUserPrompt({
      requestQuery: 'full digital twin prompt ignored',
      data: {
        structuredResponseMode: 'conversation',
        promptProfile: 'conversation',
        userQuery: 'How about domestic trips?',
        conversationHistory: history,
        conversationThread: hints,
      },
    });

    expect(prompt).toContain('CONVERSATION THREAD');
    expect(prompt).toContain('domestic');
    expect(prompt).toContain('How about domestic trips?');
    expect(prompt).toMatch(/continue|Build on/i);
    expect(prompt).toContain('USER\'S LATEST MESSAGE');
  });

  it('enterprise analysis mode does not inject conversation momentum block in provider prompt', () => {
    const prompt = buildProviderUserPrompt({
      requestQuery: 'Analyze Q1 churn metrics',
      data: {
        structuredResponseMode: 'analysis',
        promptProfile: 'enterprise',
        userQuery: 'Analyze Q1 churn metrics',
      },
    });
    expect(prompt).not.toContain('CONVERSATION THREAD');
    expect(prompt).toContain('v2 JSON');
  });
});

describe('formatConversationTranscript', () => {
  it('preserves user and assistant turns in order', () => {
    const out = formatConversationTranscript([
      { role: 'user', content: 'Vacation ideas?' },
      { role: 'assistant', content: 'Try Savannah.' },
    ]);
    expect(out).toContain('User:');
    expect(out).toContain('Assistant:');
    expect(out).toContain('Savannah');
  });
});

describe('enterprise regression', () => {
  it('enterprise query still infers analysis mode', () => {
    expect(
      inferStructuredResponseMode({ query: 'Analyze our Q1 churn metrics for the leadership dashboard' }).mode
    ).toBe('analysis');
  });
});
