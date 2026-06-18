import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatDashboardSystemHealth } from '../adminPortalDashboard';

const DASHBOARD_PAGE_PATH = join(__dirname, '../../app/admin-portal/dashboard/page.tsx');

describe('formatDashboardSystemHealth', () => {
  it('returns Unavailable when health status is unavailable', () => {
    expect(formatDashboardSystemHealth(null, 'unavailable')).toBe('Unavailable');
    expect(formatDashboardSystemHealth(99.9, 'unavailable')).toBe('Unavailable');
  });

  it('returns Unavailable when health score is null', () => {
    expect(formatDashboardSystemHealth(null, 'available')).toBe('Unavailable');
    expect(formatDashboardSystemHealth(null)).toBe('Unavailable');
  });

  it('renders successful dashboard health without fake fallback', () => {
    expect(formatDashboardSystemHealth(85, 'available')).toBe('85%');
    expect(formatDashboardSystemHealth(85, 'available')).not.toBe('99.9%');
    expect(formatDashboardSystemHealth(85, 'available')).not.toContain('99.9');
  });
});

describe('admin portal dashboard mock fallback hygiene', () => {
  it('dashboard/page.tsx does not contain AP-F-005 fake health fallback', () => {
    const source = readFileSync(DASHBOARD_PAGE_PATH, 'utf8');

    expect(source.includes('systemHealth: 99.9')).toBe(false);
    expect(source.includes('|| 99.9')).toBe(false);
    expect(source.includes('formatDashboardSystemHealth')).toBe(true);
    expect(source.includes('Try again')).toBe(true);
    expect(source.includes('setStats(null)')).toBe(true);
  });
});
