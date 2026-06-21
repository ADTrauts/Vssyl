import { describe, it, expect } from 'vitest';
import {
  SETTINGS_NAVIGATION_CONTRACT,
  getInHubNavigation,
  getExternalNavigation,
  SETTINGS_CANONICAL_SECTIONS,
} from '../settingsNavigationContract';

describe('settingsNavigationContract', () => {
  it('defines canonical sections', () => {
    const ids = SETTINGS_CANONICAL_SECTIONS.map((s) => s.id);
    expect(ids).toContain('profile');
    expect(ids).toContain('appearance');
    expect(ids).toContain('privacy');
    expect(ids).toContain('notifications');
    expect(ids).toContain('security');
    expect(ids).toContain('billing');
  });

  it('privacy href points to settings hub', () => {
    const privacy = SETTINGS_NAVIGATION_CONTRACT.find((e) => e.id === 'privacy');
    expect(privacy?.href).toBe('/profile/settings?tab=privacy');
    expect(privacy?.disposition).toBe('in_hub');
  });

  it('notifications is external link to dedicated page', () => {
    const notifications = SETTINGS_NAVIGATION_CONTRACT.find((e) => e.id === 'notifications');
    expect(notifications?.href).toBe('/notifications/settings');
    expect(notifications?.disposition).toBe('external_link');
  });

  it('in-hub navigation is ordered', () => {
    const inHub = getInHubNavigation();
    expect(inHub.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < inHub.length; i++) {
      expect(inHub[i].order).toBeGreaterThanOrEqual(inHub[i - 1].order);
    }
  });

  it('external navigation includes notifications', () => {
    const external = getExternalNavigation();
    expect(external.some((e) => e.id === 'notifications')).toBe(true);
  });
});
