import { describe, expect, it } from 'vitest';
import {
  getRetrievalLimitForIntent,
  isRetrievalConsumerEnabled,
  resolveRetrievalConsumerIntent,
  RETRIEVAL_ADAPTER_CONSUMER_INTENTS,
} from '../aiRetrievalConsumerContract';

describe('aiRetrievalConsumerContract', () => {
  it('defines wired consumer intents in priority order', () => {
    expect(RETRIEVAL_ADAPTER_CONSUMER_INTENTS).toEqual([
      'workflow_action',
      'business_operations',
      'project_assistant',
      'local_discovery',
      'planning',
    ]);
  });

  it('resolves local_discovery before planning when both present', () => {
    expect(resolveRetrievalConsumerIntent(['planning', 'local_discovery'])).toBe('local_discovery');
  });

  it('resolves project_assistant before local_discovery when both present', () => {
    expect(resolveRetrievalConsumerIntent(['local_discovery', 'project_assistant'])).toBe(
      'project_assistant'
    );
  });

  it('applies local_discovery retrieval limit of 12', () => {
    expect(getRetrievalLimitForIntent('local_discovery')).toBe(12);
  });

  it('requires opt-in for local_discovery feature flag', () => {
    delete process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED;
    expect(isRetrievalConsumerEnabled('local_discovery')).toBe(false);

    process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED = 'true';
    expect(isRetrievalConsumerEnabled('local_discovery')).toBe(true);
  });

  it('requires opt-in for project_assistant feature flag', () => {
    delete process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED;
    expect(isRetrievalConsumerEnabled('project_assistant')).toBe(false);

    process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED = 'true';
    expect(isRetrievalConsumerEnabled('project_assistant')).toBe(true);
  });
});
