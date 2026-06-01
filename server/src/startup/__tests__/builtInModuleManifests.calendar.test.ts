import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests calendar (Wave 2 Phase 2B)', () => {
  it('declares only implemented calendar event entity and vlink capability', () => {
    const manifest = buildBuiltInModuleManifest('calendar');
    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.capabilities?.search).toBe(true);
    expect(manifest.capabilities?.realtime).toBe(true);
    expect(manifest.entities).toHaveLength(1);
    expect(manifest.entities?.[0]).toMatchObject({
      type: 'event',
      vlinkEntityType: 'CALENDAR_EVENT',
      supportsTrash: true,
      supportsSearch: true,
    });
  });

  it('includes calendar_reminder notification metadata only for emitted type', () => {
    const manifest = buildBuiltInModuleManifest('calendar');
    expect(manifest.notifications).toHaveLength(1);
    expect(manifest.notifications?.[0]?.type).toBe('calendar_reminder');
  });
});
