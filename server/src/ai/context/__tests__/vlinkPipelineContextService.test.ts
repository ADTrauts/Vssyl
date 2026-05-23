import { describe, expect, it } from 'vitest';
import {
  detectVLinkQuerySignals,
  mapVLinkPipelineContextToRetrieved,
  shouldPrioritizeVLinkContext,
  toPersistedVLinksForEntityLinking,
} from '../vlinkPipelineContextService';

describe('vlinkPipelineContextService', () => {
  it('detects VL-code and relationship query signals', () => {
    const signals = detectVLinkQuerySignals('What is connected to VL-483920174625?');
    expect(signals.vlCodeReferenced).toBe(true);
    expect(signals.relationshipQuery).toBe(true);
    expect(shouldPrioritizeVLinkContext(signals)).toBe(true);
  });

  it('maps pipeline context to vlink trace records', () => {
    const rows = mapVLinkPipelineContextToRetrieved({
      items: [
        {
          vlinkId: 'vl-1',
          publicCode: 'VL-111111111111',
          title: 'Pack',
          scope: 'personal',
          parentVLinkId: null,
          description: null,
          updatedAt: new Date(),
          linkedEntities: [],
          restrictedLinkedEntityCount: 0,
          accessibleLinkedEntityCount: 0,
        },
      ],
      vlinksConsidered: 1,
      vlinksUsed: 1,
      linkedEntitiesConsidered: 0,
      accessibleLinkedEntities: 0,
      restrictedLinkedEntities: 0,
      suggestionsIgnored: 0,
      querySignals: detectVLinkQuerySignals('my vlinks'),
    });

    expect(rows).toEqual([{ source: 'vlink', provider: 'recent_vlinks', itemCount: 1 }]);
  });

  it('maps empty vlink context for trace checklist', () => {
    const rows = mapVLinkPipelineContextToRetrieved({
      items: [],
      vlinksConsidered: 0,
      vlinksUsed: 0,
      linkedEntitiesConsidered: 0,
      accessibleLinkedEntities: 0,
      restrictedLinkedEntities: 0,
      suggestionsIgnored: 0,
      querySignals: detectVLinkQuerySignals('hello'),
      skippedReason: 'none',
    });
    expect(rows[0]?.source).toBe('vlink');
    expect(rows[0]?.itemCount).toBe(0);
  });

  it('converts pipeline items to persisted entity linking input', () => {
    const persisted = toPersistedVLinksForEntityLinking({
      items: [
        {
          vlinkId: 'vl-1',
          publicCode: 'VL-222222222222',
          title: 'Ops',
          scope: 'business',
          parentVLinkId: null,
          description: null,
          updatedAt: new Date(),
          linkedEntities: [
            {
              entityType: 'file',
              entityId: 'f1',
              moduleId: 'drive',
              title: 'Budget.xlsx',
              access: 'full',
            },
            {
              entityType: 'calendar_event',
              entityId: 'e1',
              moduleId: 'calendar',
              title: 'Calendar event',
              access: 'restricted',
            },
          ],
          restrictedLinkedEntityCount: 1,
          accessibleLinkedEntityCount: 1,
        },
      ],
      vlinksConsidered: 1,
      vlinksUsed: 1,
      linkedEntitiesConsidered: 2,
      accessibleLinkedEntities: 1,
      restrictedLinkedEntities: 1,
      suggestionsIgnored: 0,
      querySignals: detectVLinkQuerySignals('related to my workstream'),
    });

    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.linkKind).toBe('confirmed_vlink');
    expect(persisted[0]?.entityTypes).toEqual(['file', 'calendar_event']);
  });
});
