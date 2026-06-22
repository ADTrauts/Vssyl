import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_CAPABILITY_SURFACES,
  isCanonicalAnalyticsCapabilityPath,
  getAnalyticsCapabilitySurface,
} from '../analyticsCapabilityOwnership';

describe('analyticsCapabilityOwnership', () => {
  it('lists canonical capability surfaces', () => {
    const canonical = ANALYTICS_CAPABILITY_SURFACES.filter((s) => s.role === 'canonical');
    expect(canonical.length).toBe(4);
    expect(canonical.map((s) => s.id)).toEqual(
      expect.arrayContaining(['dashboard-summary', 'personal', 'module', 'export'])
    );
  });

  it('identifies canonical API paths', () => {
    expect(isCanonicalAnalyticsCapabilityPath('/api/analytics/personal')).toBe(true);
    expect(isCanonicalAnalyticsCapabilityPath('/api/analytics/modules/chat')).toBe(true);
    expect(isCanonicalAnalyticsCapabilityPath('/api/chat/analytics')).toBe(false);
  });

  it('resolves surface by id', () => {
    const surface = getAnalyticsCapabilitySurface('dashboard-facade');
    expect(surface?.role).toBe('consumer');
    expect(surface?.owner).toBe('Dashboard Module');
  });
});
