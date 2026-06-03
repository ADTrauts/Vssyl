import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests notebook (Phase 1 MLVP)', () => {
  it('declares facade permissions without trash or vlink', () => {
    const manifest = buildBuiltInModuleManifest('notebook');
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(['notes:read', 'notes:write', 'todo:read', 'todo:write'])
    );
    expect(manifest.capabilities.trash).toBeUndefined();
    expect(manifest.capabilities.vlink).toBeUndefined();
    expect(manifest.capabilities.businessWorkspace).toBe(true);
    expect(manifest.routes?.[0]?.path).toBe('/notebook');
  });
});
