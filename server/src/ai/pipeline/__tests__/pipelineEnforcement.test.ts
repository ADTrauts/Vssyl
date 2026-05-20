import { describe, expect, it } from 'vitest';
import { buildPipelineTrace, GROUNDING_ISSUE } from '../buildPipelineTrace';
import {
  applyPipelineEnforcement,
  shouldBlockUngroundedResponse,
  shouldRunGroundingRetrievalPrepass,
} from '../pipelineEnforcement';

describe('pipelineEnforcement', () => {
  const ungroundedTrace = buildPipelineTrace({
    userId: 'u1',
    userMessage: 'Any yoga clubs near me?',
    finalResponse: 'You may want to check local listings online.',
  });

  it('detects grounding violation on local discovery without retrieval', () => {
    expect(ungroundedTrace.issues).toContain(GROUNDING_ISSUE);
    expect(ungroundedTrace.retrievalPerformed).toBe(false);
  });

  it('shouldRunGroundingRetrievalPrepass only for regenerate mode', () => {
    expect(
      shouldRunGroundingRetrievalPrepass({ enforcementEnabled: true, enforcementMode: 'regenerate' })
    ).toBe(true);
    expect(
      shouldRunGroundingRetrievalPrepass({ enforcementEnabled: true, enforcementMode: 'block' })
    ).toBe(false);
  });

  it('blocks ungrounded responses when mode is block', () => {
    expect(
      shouldBlockUngroundedResponse(
        { enforcementEnabled: true, enforcementMode: 'block' },
        ungroundedTrace
      )
    ).toBe(true);
    const result = applyPipelineEnforcement('generic answer', ungroundedTrace, {
      enforcementEnabled: true,
      enforcementMode: 'block',
    });
    expect(result.response).not.toBe('generic answer');
    expect(result.tracePatch.enforcementAction).toBe('blocked');
  });

  it('appends disclosure when mode is disclose', () => {
    const result = applyPipelineEnforcement('generic answer', ungroundedTrace, {
      enforcementEnabled: true,
      enforcementMode: 'disclose',
    });
    expect(result.response).toContain('generic answer');
    expect(result.response).toContain('may not be fully grounded');
    expect(result.tracePatch.enforcementAction).toBe('disclosed');
  });
});
