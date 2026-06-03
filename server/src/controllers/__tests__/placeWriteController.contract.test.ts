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

describe('place write controller contracts (Phase 1D)', () => {
  it('placeListingController write region has no prisma and delegates to placeListingService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeListingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-listing-write-handlers> */', '/* </place-listing-write-handlers> */');
    expect(core).toMatch(/placeListingService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeMeetingController write region has no prisma and delegates to placeMeetingService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeMeetingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-meeting-write-handlers> */', '/* </place-meeting-write-handlers> */');
    expect(core).toMatch(/placeMeetingService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });
});
