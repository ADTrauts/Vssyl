import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');

const TARGET_PAGES = [
  'app/admin-portal/support/page.tsx',
  'app/admin-portal/modules/page.tsx',
  'app/admin-portal/dashboard/page.tsx',
];

const FORBIDDEN_MARKERS = [
  'Fallback to mock data',
  'mockSubmissions',
  'john@example.com',
  'Advanced Calendar',
  'Cannot access premium features',
  'systemHealth: 99.9',
  '|| 99.9',
];

describe('adminPortalMockFallbackHygiene', () => {
  for (const relativePath of TARGET_PAGES) {
    it(`${relativePath} does not contain AP-F-005 mock fallback markers`, () => {
      const source = readFileSync(join(WEB_ROOT, relativePath), 'utf8');

      for (const marker of FORBIDDEN_MARKERS) {
        expect(source.includes(marker), `found forbidden marker "${marker}"`).toBe(false);
      }

      expect(
        source.includes('setSubmissions([])') ||
          source.includes('setTickets([])') ||
          source.includes('setStats(null)'),
      ).toBe(true);
      expect(source.includes('Try again')).toBe(true);
    });
  }
});
