import { describe, expect, it } from 'vitest';
import { runConversationReasoning } from '../conversationReasoningLayer';
import { confidenceBand } from '../understandingConfidence';

const BURNOUT_EXPLORE =
  "I'm feeling burnt out lately but I can't tell if I actually need rest or just a change of pace.";

const TASK_STRATEGIES = 'What are strategies to manage tasks?';

const JOB_BOUNDARIES =
  "What if it's my job and I don't know how to slow down or turn down tasks?";

describe('conversationReasoningLayer', () => {
  it('burnout exploration: explore, low confidence, high premature risk, reflect_and_probe', () => {
    const result = runConversationReasoning({ query: BURNOUT_EXPLORE });

    expect(result.conversationObjective).toBe('explore');
    expect(confidenceBand(result.understandingConfidence)).toBe('low');
    expect(result.prematureSolutionRisk).toBe('high');
    expect(result.recommendedResponseAction).toBe('reflect_and_probe');
    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(result.criticalUnknowns.some((u) => /recovery|stimulation|boundary|purpose/i.test(u))).toBe(
      true
    );
    expect(result.responseGuidance.some((g) => /vacation|hobbies|productivity/i.test(g))).toBe(
      true
    );
  });

  it('explicit strategy ask: learn/plan path, higher confidence, low risk, answer or framework', () => {
    const result = runConversationReasoning({ query: TASK_STRATEGIES });

    expect(['learn', 'plan']).toContain(result.conversationObjective);
    expect(confidenceBand(result.understandingConfidence)).not.toBe('low');
    expect(result.prematureSolutionRisk).toBe('low');
    expect(['provide_answer', 'offer_framework', 'provide_plan']).toContain(
      result.recommendedResponseAction
    );
  });

  it('job boundary diagnosis: diagnose, medium confidence, elevated risk, probe not vacation list', () => {
    const result = runConversationReasoning({ query: JOB_BOUNDARIES });

    expect(result.conversationObjective).toBe('diagnose');
    expect(confidenceBand(result.understandingConfidence)).toBe('medium');
    expect(result.understandingConfidence).toBeLessThan(80);
    expect(['medium', 'high']).toContain(result.prematureSolutionRisk);
    expect(['reflect_and_probe', 'ask_clarifying_question', 'offer_framework']).toContain(
      result.recommendedResponseAction
    );
    expect(
      result.responseGuidance.some((g) =>
        /boundar|identity|pressure|letting people down|task/i.test(g)
      )
    ).toBe(true);
  });

  it('returns full diagnostic shape', () => {
    const result = runConversationReasoning({ query: BURNOUT_EXPLORE });
    expect(result).toMatchObject({
      conversationObjective: expect.any(String),
      understandingConfidence: expect.any(Number),
      missingInformation: expect.any(Array),
      criticalUnknowns: expect.any(Array),
      prematureSolutionRisk: expect.any(String),
      recommendedResponseAction: expect.any(String),
      responseGuidance: expect.any(Array),
    });
  });
});
