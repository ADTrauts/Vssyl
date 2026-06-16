import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests scheduling (CO-09 / G13)', () => {
  it('declares scheduling V-Link entities and runtime capabilities', () => {
    const manifest = buildBuiltInModuleManifest('scheduling');

    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.capabilities?.globalActivity).toBe(true);
    expect(manifest.entities).toHaveLength(3);
    expect(manifest.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'schedule',
          vlinkEntityType: 'SCHEDULE',
          supportsTrash: true,
        }),
        expect.objectContaining({
          type: 'shift',
          vlinkEntityType: 'SCHEDULE_SHIFT',
          supportsTrash: true,
        }),
        expect.objectContaining({
          type: 'swap_request',
          vlinkEntityType: 'SHIFT_SWAP_REQUEST',
          supportsTrash: false,
        }),
      ])
    );
  });

  it('does not declare deferred template entities in manifest', () => {
    const manifest = buildBuiltInModuleManifest('scheduling');
    const types = manifest.entities?.map((entity) => entity.type) ?? [];

    expect(types).not.toContain('schedule_template');
    expect(types).not.toContain('shift_template');
  });

  it('does not declare realtime until certified schedulingRealtimeService exists', () => {
    const manifest = buildBuiltInModuleManifest('scheduling');
    expect(manifest.capabilities?.realtime).not.toBe(true);
  });
});
