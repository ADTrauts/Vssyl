import { describe, expect, it } from 'vitest';
import { DEFAULT_PIPELINE_CONTEXT_SOURCES, getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { SYSTEM_CONTEXT_SOURCE_IDS, isSystemContextSourceId } from '../pipelineRegistryIds';

describe('pipeline catalog vlink source', () => {
  it('includes vlink in default context sources with required metadata', () => {
    const vlink = DEFAULT_PIPELINE_CONTEXT_SOURCES.find((s) => s.id === 'vlink');
    expect(vlink).toMatchObject({
      id: 'vlink',
      label: 'V_Link Relationships',
      description: 'Permission-filtered relationship graph context from confirmed V_Links.',
      enabled: true,
      wiredInTwin: true,
    });
  });

  it('includes vlink in protected system context source ids', () => {
    expect(SYSTEM_CONTEXT_SOURCE_IDS).toContain('vlink');
    expect(isSystemContextSourceId('vlink')).toBe(true);
  });

  it('includes optional vlink grounding on planning and workflow intents', () => {
    const catalog = getDefaultPipelineCatalog();
    const planning = catalog.groundingRules.find((r) => r.intentId === 'planning');
    const workflow = catalog.groundingRules.find((r) => r.intentId === 'workflow_action');
    const business = catalog.groundingRules.find((r) => r.intentId === 'business_operations');
    expect(planning?.optionalSources).toContain('vlink');
    expect(workflow?.optionalSources).toContain('vlink');
    expect(business?.optionalSources).toContain('vlink');
  });
});
