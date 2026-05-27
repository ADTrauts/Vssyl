import { describe, expect, it } from 'vitest';
import { parseContextProviders } from '../../services/moduleContextProviderCertification';
import { normalizeRegistryProvider } from '../contextProviderRegistry';

const wave1DriveRecent = {
  name: 'recent_files',
  endpoint: '/api/drive/ai/context/recent',
  cacheDuration: 300000,
  supportedIntents: ['workflow_action', 'planning', 'technical_help', 'general_chat'],
  retrievalCost: 'low',
  priority: 80,
  pipelineSourceIds: ['drive_files', 'module_context'],
  volatility: 'dynamic',
  freshnessPolicy: { maxAgeMs: 300000 },
};

describe('wave-1 provider metadata normalization', () => {
  it('parses extended provider fields from registry JSON', () => {
    const parsed = parseContextProviders([wave1DriveRecent]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.supportedIntents).toEqual(wave1DriveRecent.supportedIntents);
    expect(parsed[0]?.retrievalCost).toBe('low');
    expect(parsed[0]?.pipelineSourceIds).toContain('drive_files');
  });

  it('normalizes defaults when optional metadata omitted', () => {
    const normalized = normalizeRegistryProvider('todo', 'Todo', {
      name: 'task_overview',
      endpoint: '/api/todo/ai/context/overview',
      cacheDuration: 300000,
    });
    expect(normalized.supportedIntents).toContain('workflow_action');
    expect(normalized.retrievalCost).toBe('medium');
    expect(normalized.priority).toBe(50);
  });

  it('preserves place discoveries vssyl_place mapping', () => {
    const normalized = normalizeRegistryProvider('place', 'Place', {
      name: 'place_discoveries',
      endpoint: '/api/place/ai/context/discoveries',
      cacheDuration: 600000,
      supportedIntents: ['local_discovery', 'recommendation'],
      pipelineSourceIds: ['vssyl_place', 'module_context'],
      priority: 90,
      retrievalCost: 'medium',
    });
    expect(normalized.pipelineSourceIds).toContain('vssyl_place');
    expect(normalized.supportedIntents).toContain('local_discovery');
  });
});
