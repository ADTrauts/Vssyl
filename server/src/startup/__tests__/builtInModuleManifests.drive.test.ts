import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest, reconcileBuiltInManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests drive notifications (FH-4)', () => {
  it('includes File Hub notification metadata catalog', () => {
    const manifest = buildBuiltInModuleManifest('drive');
    expect(manifest.notifications?.length).toBeGreaterThanOrEqual(5);
    const types = manifest.notifications?.map((n) => n.type) ?? [];
    expect(types).toContain('drive_permission');
    expect(types).toContain('drive_item_restored');
    expect(types).toContain('drive_item_deleted');
  });

  it('reconcileBuiltInManifest merges notifications into existing manifest', () => {
    const reconciled = reconcileBuiltInManifest('drive', { partnerKey: 'keep' });
    expect(reconciled.partnerKey).toBe('keep');
    expect(Array.isArray(reconciled.notifications)).toBe(true);
  });
});
