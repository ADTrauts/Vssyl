import { describe, it, expect } from 'vitest';
import {
  getRegistryEntry,
  resolveRegistryMetadata,
  isWritableViaSettingsApi,
  validateRegistryValue,
  SettingsRegistryError,
  PREFERENCE_REGISTRY,
} from '../preferenceRegistry';

describe('preferenceRegistry', () => {
  it('defines appearance.theme with enum values', () => {
    const entry = getRegistryEntry('appearance.theme');
    expect(entry).toBeDefined();
    expect(entry?.owner).toBe('settings');
    expect(entry?.allowedValues).toContain('dark');
    expect(entry?.writableViaSettingsApi).toBe(true);
  });

  it('marks privacy keys as read-only via settings API', () => {
    const meta = resolveRegistryMetadata('privacy.profileVisibility');
    expect(meta.known).toBe(true);
    expect(isWritableViaSettingsApi('privacy.profileVisibility')).toBe(false);
  });

  it('resolves notification_ prefix rule', () => {
    const meta = resolveRegistryMetadata('notification_chat');
    expect(meta.known).toBe(true);
    expect(meta.prefixRule?.owner).toBe('notifications');
  });

  it('rejects unknown keys', () => {
    expect(resolveRegistryMetadata('totally.unknown').known).toBe(false);
  });

  it('validates enum values', () => {
    expect(() => validateRegistryValue('appearance.theme', 'invalid')).toThrow(SettingsRegistryError);
    expect(() => validateRegistryValue('appearance.theme', 'light')).not.toThrow();
  });

  it('has at least core registry entries', () => {
    expect(PREFERENCE_REGISTRY.length).toBeGreaterThanOrEqual(4);
  });
});
