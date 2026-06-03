import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(process.cwd(), '..');

describe('Place Wave 2A schema', () => {
  it('includes trashedAt on listing and meeting models in prisma module', () => {
    const schema = readFileSync(
      join(repoRoot, 'prisma/modules/place/place.prisma'),
      'utf8'
    );
    expect(schema).toMatch(/model BusinessPlaceListing[\s\S]*?trashedAt\s+DateTime\?/);
    expect(schema).toMatch(/model PlaceMeetingPlace[\s\S]*?trashedAt\s+DateTime\?/);

    const placeNodeBlock = schema.match(/model PlaceNode \{[\s\S]*?\n\}/)?.[0] ?? '';
    const placeCommunityBlock = schema.match(/model PlaceCommunity \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(placeNodeBlock).not.toContain('trashedAt');
    expect(placeCommunityBlock).not.toContain('trashedAt');
  });

  it('has migration for listing/meeting trash and V_Link enum values', () => {
    const migration = readFileSync(
      join(
        repoRoot,
        'prisma/migrations/20260603140000_place_listing_meeting_trash_vlink/migration.sql'
      ),
      'utf8'
    );
    expect(migration).toContain('business_place_listings');
    expect(migration).toContain('place_meeting_places');
    expect(migration).toContain("'PLACE_LISTING'");
    expect(migration).toContain("'PLACE_MEETING'");
  });
});
