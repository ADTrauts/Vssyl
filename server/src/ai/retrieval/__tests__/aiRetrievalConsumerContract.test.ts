import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  getRetrievalLimitForIntent,
  isRetrievalConsumerEnabled,
  resolveRetrievalConsumerIntent,
  RETRIEVAL_ADAPTER_CONSUMER_INTENTS,
} from '../aiRetrievalConsumerContract';

describe('aiRetrievalConsumerContract', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('defines wired consumer intents in priority order', () => {
    expect(RETRIEVAL_ADAPTER_CONSUMER_INTENTS).toEqual([
      'workflow_action',
      'business_operations',
      'project_assistant',
      'local_discovery',
      'planning',
      'general_discovery',
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

  it('resolves general_discovery for research intent', () => {
    expect(resolveRetrievalConsumerIntent(['research'])).toBe('general_discovery');
  });

  it('resolves general_discovery for query-native find patterns', () => {
    expect(
      resolveRetrievalConsumerIntent(['general_chat'], 'find my calendar meeting notes')
    ).toBe('general_discovery');
  });

  it('applies local_discovery retrieval limit of 12', () => {
    expect(getRetrievalLimitForIntent('local_discovery')).toBe(12);
  });

  it('enables project_assistant and local_discovery by default (Wave 3)', () => {
    delete process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED;
    delete process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED;
    expect(isRetrievalConsumerEnabled('project_assistant')).toBe(true);
    expect(isRetrievalConsumerEnabled('local_discovery')).toBe(true);
  });

  it('allows opt-out for project_assistant and local_discovery', () => {
    process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED = 'false';
    process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED = 'false';
    expect(isRetrievalConsumerEnabled('project_assistant')).toBe(false);
    expect(isRetrievalConsumerEnabled('local_discovery')).toBe(false);
  });
});
