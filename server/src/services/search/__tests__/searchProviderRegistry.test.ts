import { describe, expect, it } from 'vitest';
import {
  MANIFEST_SEARCH_MODULE_IDS,
  assertManifestSearchProviderParity,
  getRegisteredSearchProviders,
  getSearchProviderById,
} from '../searchProviderRegistry';
import { buildBuiltInModuleManifest } from '../../../startup/builtInModuleManifests';

describe('searchProviderRegistry', () => {
  it('registers calendar, todo, and notes providers', () => {
    expect(getSearchProviderById('calendar')?.readiness).toBe('ready');
    expect(getSearchProviderById('todo')?.readiness).toBe('ready');
    expect(getSearchProviderById('notes')?.readiness).toBe('ready');
  });

  it('has parity between manifest search claims and ready providers', () => {
    expect(() => assertManifestSearchProviderParity()).not.toThrow();
  });

  it('includes all manifest search module ids in registry', () => {
    const readyIds = new Set(
      getRegisteredSearchProviders()
        .filter((p) => p.readiness === 'ready')
        .map((p) => p.providerId)
    );

    for (const moduleId of MANIFEST_SEARCH_MODULE_IDS) {
      expect(readyIds.has(moduleId)).toBe(true);
    }
  });

  it('aligns built-in manifest search flags with registered providers', () => {
    for (const moduleId of MANIFEST_SEARCH_MODULE_IDS) {
      const manifest = buildBuiltInModuleManifest(moduleId);
      expect(manifest.capabilities?.search).toBe(true);
      expect(getSearchProviderById(moduleId)?.manifestSearchClaim).toBe(true);
    }
  });

  it('registers Wave 2 business and notebook providers', () => {
    expect(getSearchProviderById('notebook')?.readiness).toBe('ready');
    expect(getSearchProviderById('hr')?.readiness).toBe('ready');
    expect(getSearchProviderById('scheduling')?.readiness).toBe('ready');
    expect(getSearchProviderById('workforce_comms')?.readiness).toBe('ready');
  });

  it('claims global search for scheduling via manifest parity', () => {
    const manifest = buildBuiltInModuleManifest('scheduling');
    expect(manifest.capabilities?.search).toBe(true);
    expect(getSearchProviderById('scheduling')?.manifestSearchClaim).toBe(true);
  });
});
