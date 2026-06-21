import { describe, expect, it } from 'vitest';
import { DEFAULT_PIPELINE_CONTEXT_SOURCES, getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { SYSTEM_CONTEXT_SOURCE_IDS, isSystemContextSourceId } from '../pipelineRegistryIds';

describe('pipeline catalog graph_bundle source (CG-1D)', () => {
  it('includes graph_bundle in default context sources with required metadata', () => {
    const graphBundle = DEFAULT_PIPELINE_CONTEXT_SOURCES.find((s) => s.id === 'graph_bundle');
    expect(graphBundle).toMatchObject({
      id: 'graph_bundle',
      label: 'Context Graph Bundles',
      enabled: true,
      wiredInTwin: true,
    });
  });

  it('includes graph_bundle in protected system context source ids', () => {
    expect(SYSTEM_CONTEXT_SOURCE_IDS).toContain('graph_bundle');
    expect(isSystemContextSourceId('graph_bundle')).toBe(true);
  });

  it('includes optional graph_bundle grounding on planning and workflow intents', () => {
    const catalog = getDefaultPipelineCatalog();
    const planning = catalog.groundingRules.find((r) => r.intentId === 'planning');
    const workflow = catalog.groundingRules.find((r) => r.intentId === 'workflow_action');
    const business = catalog.groundingRules.find((r) => r.intentId === 'business_operations');
    expect(planning?.optionalSources).toContain('graph_bundle');
    expect(workflow?.optionalSources).toContain('graph_bundle');
    expect(business?.optionalSources).toContain('graph_bundle');
  });
});
