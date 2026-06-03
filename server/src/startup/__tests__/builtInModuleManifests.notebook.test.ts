import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests notebook (Phase 7+)', () => {
  it('declares truthful capabilities without trash or vlink on module', () => {
    const manifest = buildBuiltInModuleManifest('notebook');
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(['notes:read', 'notes:write', 'todo:read', 'todo:write'])
    );
    expect(manifest.capabilities.trash).toBeUndefined();
    expect(manifest.capabilities.vlink).toBeUndefined();
    expect(manifest.capabilities.ai).toBe(true);
    expect(manifest.capabilities.operationalLinks).toBe(true);
    expect(manifest.capabilities.businessWorkspace).toBe(true);
    expect(manifest.routes?.[0]?.path).toBe('/notebook');
  });

  it('declares page entity with NOTE vlink alias (product notebook:page)', () => {
    const manifest = buildBuiltInModuleManifest('notebook');
    expect(manifest.entities).toHaveLength(1);
    expect(manifest.entities?.[0]).toMatchObject({
      type: 'page',
      displayName: 'Page',
      vlinkEntityType: 'NOTE',
      supportsTrash: true,
      supportsSearch: true,
    });
  });
});
