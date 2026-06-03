import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests place (Wave 2A)', () => {
  it('declares trash, vlink, and listing/meeting entities only', () => {
    const manifest = buildBuiltInModuleManifest('place');
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.search).toBe(true);
    expect(manifest.entities).toHaveLength(2);
    expect(manifest.entities?.map((e) => e.type)).toEqual(['listing', 'meeting']);
    expect(manifest.entities?.[0]).toMatchObject({
      type: 'listing',
      vlinkEntityType: 'PLACE_LISTING',
      supportsTrash: true,
    });
    expect(manifest.entities?.[1]).toMatchObject({
      type: 'meeting',
      vlinkEntityType: 'PLACE_MEETING',
      supportsTrash: true,
      supportsSearch: false,
    });
  });

  it('includes all emitted place notification types', () => {
    const manifest = buildBuiltInModuleManifest('place');
    expect(manifest.notifications?.map((n) => n.type)).toEqual([
      'place_meeting_invite',
      'place_meeting_rsvp',
      'place_connection_request',
      'place_connection_accepted',
      'place_community_member_joined',
      'place_community_member_left',
    ]);
  });
});
