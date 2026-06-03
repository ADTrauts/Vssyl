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

/**
 * Documented controller exceptions (Wave 1G):
 * - placeTransactionController — commerce telemetry deferred (Phase 2A+ / product priority)
 * - placeAnalyticsController.recordActivity — legacy feed write helper (deprecated)
 */

describe('Place controller contracts (Phase 1G)', () => {
  it('placeController core graph handlers have no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-core-graph-handlers> */', '/* </place-core-graph-handlers> */');
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeController getPlace delegates to visibility enrichment', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeController.ts'), 'utf8');
    const core = extractRegion(
      source,
      '/* <place-get-enriched-handlers> */',
      '/* </place-get-enriched-handlers> */'
    );
    expect(core).toMatch(/placeVisibilityService\.getEnrichedPlaceGraph/);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeController connection handlers delegate to placeConnectionService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-connection-handlers> */', '/* </place-connection-handlers> */');
    expect(core).toMatch(/placeConnectionService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeCommunityController handlers delegate to placeCommunityService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeCommunityController.ts'), 'utf8');
    const core = extractRegion(
      source,
      '/* <place-community-handlers> */',
      '/* </place-community-handlers> */'
    );
    expect(core).toMatch(/placeCommunityService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeDiscoveryController dismiss delegates to placeService', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeDiscoveryController.ts'), 'utf8');
    const core = extractRegion(
      source,
      '/* <place-discovery-write-handlers> */',
      '/* </place-discovery-write-handlers> */'
    );
    expect(core).toMatch(/placeService\.dismissSuggestion/);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeDiscoveryController visibility reads have no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeDiscoveryController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-visibility-read-handlers> */', '/* </place-visibility-read-handlers> */');
    expect(core).toMatch(/placeVisibilityService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeListingController write region has no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeListingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-listing-write-handlers> */', '/* </place-listing-write-handlers> */');
    expect(core).toMatch(/placeListingService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeMeetingController write region has no prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeMeetingController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-meeting-write-handlers> */', '/* </place-meeting-write-handlers> */');
    expect(core).toMatch(/placeMeetingService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeAIController handlers have no prisma (Wave 1F)', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeAIController.ts'), 'utf8');
    const core = extractRegion(source, '/* <place-ai-handlers> */', '/* </place-ai-handlers> */');
    expect(core).toMatch(/placeAIActionService\./);
    expect(core).not.toMatch(/\bprisma\./);
  });

  it('placeTransactionController remains deferred exception with prisma', () => {
    const source = readFileSync(join(process.cwd(), 'src/controllers/placeTransactionController.ts'), 'utf8');
    expect(source).toMatch(/\bprisma\./);
    expect(source).toMatch(/deferred/i);
  });
});
