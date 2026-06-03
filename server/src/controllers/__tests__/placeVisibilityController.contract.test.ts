import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function extractRegion(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Markers missing: ${startMarker}`);
  }
  return source.slice(start, end);
}

describe('place visibility controller contracts (Phase 1C)', () => {
  it('placeListingController read handlers delegate to placeVisibilityService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeListingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\.getListingForAdmin/);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeListingController explore/profile delegate without prisma in handler bodies', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeListingController.ts'), 'utf8');
    expect(source).toMatch(/placeVisibilityService\.exploreListings/);
    expect(source).toMatch(/placeVisibilityService\.getBusinessProfile/);
  });

  it('placeDiscoveryController read handlers have no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeDiscoveryController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeAnalyticsController visibility region has no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeAnalyticsController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeAnalyticsController getActivityFeed delegates without prisma in handler', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeAnalyticsController.ts'), 'utf8');
    const start = source.indexOf('export async function getActivityFeed');
    const end = source.indexOf('/* <place-visibility-read-handlers> */');
    const block = source.slice(start, end);
    expect(block).toMatch(/placeVisibilityService\.getActivityFeed/);
    expect(block).not.toMatch(/\bprisma\./);
  });

  it('placeController visibility read handlers delegate to placeVisibilityService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\.getPlaceContextOverview/);
    expect(core).toMatch(/placeVisibilityService\.getConnections/);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeMeetingController read handlers delegate to placeVisibilityService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeMeetingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\.listMeetingsForUser/);
    expect(core).not.toMatch(/\bprisma\./);
  });
});
