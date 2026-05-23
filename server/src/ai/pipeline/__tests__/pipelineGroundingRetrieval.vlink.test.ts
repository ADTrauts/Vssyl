import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';

vi.mock('../../context/vlinkPipelineContextService', () => ({
  detectVLinkQuerySignals: vi.fn(() => ({
    vlCodeReferenced: false,
    relationshipQuery: false,
    intentBoost: true,
  })),
  fetchVLinkPipelineContext: vi.fn(async () => ({
    items: [],
    vlinksConsidered: 0,
    vlinksUsed: 0,
    linkedEntitiesConsidered: 0,
    accessibleLinkedEntities: 0,
    restrictedLinkedEntities: 0,
    suggestionsIgnored: 0,
    querySignals: { vlCodeReferenced: false, relationshipQuery: false, intentBoost: true },
    skippedReason: 'none',
  })),
  mapVLinkPipelineContextToRetrieved: vi.fn(() => [
    { source: 'vlink', provider: 'recent_vlinks', itemCount: 0 },
  ]),
  shouldPrioritizeVLinkContext: vi.fn(() => false),
}));

import { fetchVLinkPipelineContext } from '../../context/vlinkPipelineContextService';

describe('pipelineGroundingRetrieval vlink rules', () => {
  beforeEach(() => {
    vi.mocked(fetchVLinkPipelineContext).mockClear();
  });

  it('considers optional vlink for planning intent even when grounding is not required', async () => {
    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Help me plan my week and connected workstreams',
      catalog,
    });

    expect(fetchVLinkPipelineContext).toHaveBeenCalled();
    expect(result.contextRetrieved.some((r) => r.source === 'vlink')).toBe(true);
  });

  it('does not require vlink for generic chat', async () => {
    const catalog = getDefaultPipelineCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Hello there',
      catalog,
    });

    expect(fetchVLinkPipelineContext).not.toHaveBeenCalled();
  });
});
