import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const searchControllerPath = join(process.cwd(), 'src/controllers/searchController.ts');

describe('searchController Place provider (Phase 1C)', () => {
  const source = readFileSync(searchControllerPath, 'utf8');

  it('delegates Place search to placeVisibilityService', () => {
    const start = source.indexOf('const placeSearchProvider');
    const end = source.indexOf('const vlinkSearchProvider');
    const block = source.slice(start, end);
    expect(block).toMatch(/searchListingsForUser/);
    expect(block).not.toMatch(/businessPlaceListing\.findMany/);
  });
});
