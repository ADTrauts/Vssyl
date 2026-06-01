import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest, reconcileBuiltInManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests chat notifications (Wave 1 Phase 3)', () => {
  it('includes Chat entity and vlink capability truth', () => {
    const manifest = buildBuiltInModuleManifest('chat');
    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.entities).toHaveLength(1);
    expect(manifest.entities?.[0]).toMatchObject({
      type: 'conversation',
      vlinkEntityType: 'CHAT_CONVERSATION',
      supportsTrash: true,
      supportsSearch: true,
    });
  });

  it('includes Chat notification metadata catalog', () => {
    const manifest = buildBuiltInModuleManifest('chat');
    expect(manifest.notifications?.length).toBe(3);
    const types = manifest.notifications?.map((n) => n.type) ?? [];
    expect(types).toContain('chat_message');
    expect(types).toContain('chat_mention');
    expect(types).toContain('chat_reaction');
  });

  it('reconcileBuiltInManifest merges notifications into existing manifest', () => {
    const reconciled = reconcileBuiltInManifest('chat', { partnerKey: 'keep' });
    expect(reconciled.partnerKey).toBe('keep');
    expect(Array.isArray(reconciled.notifications)).toBe(true);
    const types = (reconciled.notifications as { type: string }[] | undefined)?.map((n) => n.type) ?? [];
    expect(types).toEqual(expect.arrayContaining(['chat_message', 'chat_mention', 'chat_reaction']));
  });
});
