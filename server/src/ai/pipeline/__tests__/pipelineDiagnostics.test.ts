import { describe, expect, it } from 'vitest';
import { buildPipelineTrace, GROUNDING_ISSUE } from '../buildPipelineTrace';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { inferPipelineIntents } from '../inferPipelineIntents';

describe('inferPipelineIntents', () => {
  it('detects local_discovery for clubs/workshops near me', () => {
    const intents = inferPipelineIntents('Any good yoga clubs or workshops near me?');
    expect(intents).toContain('local_discovery');
  });

  it('detects emotional_support for burnout and change of pace', () => {
    const intents = inferPipelineIntents(
      'I feel burned out and need a change of pace — any ideas?'
    );
    expect(intents).toContain('emotional_support');
  });

  it('detects project_assistant for cross-module project queries', () => {
    const intents = inferPipelineIntents(
      'Help me understand everything related to this project'
    );
    expect(intents).toContain('project_assistant');
  });

  it('falls back to general_chat for casual messages', () => {
    expect(inferPipelineIntents('Hello, how are you?')).toEqual(['general_chat']);
    expect(inferPipelineIntents('')).toEqual(['general_chat']);
  });
});

describe('buildPipelineTrace', () => {
  const baseInput = {
    userId: 'user-test-1',
    userMessage: 'Any yoga clubs near me?',
    finalResponse: 'Here are some options in your area.',
  };

  it('local discovery with no retrieval flags grounding risk and issue', () => {
    const trace = buildPipelineTrace({
      ...baseInput,
      userMessage: 'Any yoga clubs or workshops near me?',
      finalResponse: 'You might try searching online for local options.',
    });

    expect(trace.intentDetected).toContain('local_discovery');
    expect(trace.groundingRequired).toBe(true);
    expect(trace.retrievalPerformed).toBe(false);
    expect(trace.genericResponseRisk).toBe(true);
    expect(trace.issues).toContain(GROUNDING_ISSUE);
  });

  it('burnout query detects emotional_support in trace intents', () => {
    const trace = buildPipelineTrace({
      ...baseInput,
      userMessage: 'I am burned out and need a change of pace',
      finalResponse: 'That sounds really hard. Want to talk about what feels most draining?',
    });

    expect(trace.intentDetected).toContain('emotional_support');
  });

  it('generic phrase with groundingRequired triggers genericResponseRisk', () => {
    const trace = buildPipelineTrace({
      ...baseInput,
      userMessage: 'Workshops near me this weekend',
      finalResponse:
        'You may want to consider checking local community centers or online platforms like Meetup.',
    });

    expect(trace.groundingRequired).toBe(true);
    expect(trace.genericResponseRisk).toBe(true);
    expect(trace.issues.some((i) => i.includes('generic filler'))).toBe(true);
  });

  it('general chat has groundingRequired false and no grounding issue', () => {
    const trace = buildPipelineTrace({
      ...baseInput,
      userMessage: 'Thanks for chatting earlier!',
      finalResponse: 'Happy to help anytime.',
    });

    expect(trace.intentDetected).toEqual(['general_chat']);
    expect(trace.groundingRequired).toBe(false);
    expect(trace.genericResponseRisk).toBe(false);
    expect(trace.issues).not.toContain(GROUNDING_ISSUE);
  });

  it('uses catalog override when groundingRequired is disabled for intent', () => {
    const catalog = getDefaultPipelineCatalog();
    const modified = {
      ...catalog,
      intents: catalog.intents.map((intent) =>
        intent.id === 'local_discovery' ? { ...intent, groundingRequired: false } : intent
      ),
    };
    const trace = buildPipelineTrace(
      {
        userId: 'user-test-1',
        userMessage: 'Any yoga clubs or workshops near me?',
        finalResponse: 'You might try searching online for local options.',
      },
      { catalog: modified }
    );

    expect(trace.intentDetected).toContain('local_discovery');
    expect(trace.groundingRequired).toBe(false);
    expect(trace.genericResponseRisk).toBe(false);
    expect(trace.issues).not.toContain(GROUNDING_ISSUE);
  });

  it('retrieval via memory facts clears grounding violation for recommendation', () => {
    const trace = buildPipelineTrace({
      userId: 'user-test-1',
      userMessage: 'What should I do for dinner tonight?',
      finalResponse: 'Based on your preferences, try the place you liked last month.',
      memoryRetrieved: { facts: 2, recalledMessages: 0, threadMemory: false },
    });

    expect(trace.intentDetected).toContain('recommendation');
    expect(trace.groundingRequired).toBe(true);
    expect(trace.retrievalPerformed).toBe(true);
    expect(trace.issues).not.toContain(GROUNDING_ISSUE);
  });
});
