import { describe, it, expect } from 'vitest';
import {
  SETTINGS_HUB_INVENTORY,
  getHubInventorySummary,
  listDuplicateHubs,
} from '../settingsHubInventory';

describe('settingsHubInventory', () => {
  it('tracks canonical personal settings hub', () => {
    const hub = SETTINGS_HUB_INVENTORY.find((h) => h.id === 'personal-settings-hub');
    expect(hub?.disposition).toBe('canonical');
    expect(hub?.path).toBe('/profile/settings');
  });

  it('marks legacy profile as duplicate', () => {
    const dup = listDuplicateHubs().find((h) => h.id === 'profile-legacy');
    expect(dup?.canonicalTarget).toBe('/profile/settings?tab=account');
  });

  it('reports personal hub consolidation summary', () => {
    const summary = getHubInventorySummary();
    expect(summary.personalBefore).toBe(6);
    expect(summary.personalAfter).toBe(2);
    expect(summary.canonical).toBeGreaterThan(0);
    expect(summary.duplicate).toBeGreaterThan(0);
  });
});
