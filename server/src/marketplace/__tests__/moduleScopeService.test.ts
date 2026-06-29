import { describe, expect, it } from 'vitest';
import {
  assertModuleInstallScopeAllowed,
  builtInModuleAvailableForPersonalScope,
  inferModuleScopeFromContexts,
  isMarketplaceCatalogVisible,
  isModuleManagerVisible,
  moduleScopeSupportsInstall,
  moduleScopeVisibleInMarketplace,
  validateModuleScopeManifest,
  validateSubCapabilityContexts,
} from '../moduleScopeService';

describe('moduleScopeService', () => {
  it('validates explicit moduleScope both with aligned contexts', () => {
    const result = validateModuleScopeManifest(
      {
        moduleScope: 'both',
        supportedContexts: ['personal', 'business'],
      },
      { requireExplicitScope: true }
    );
    expect(result.errors).toHaveLength(0);
    expect(result.moduleScope).toBe('both');
  });

  it('fails when moduleScope personal includes business context', () => {
    const result = validateModuleScopeManifest(
      {
        moduleScope: 'personal',
        supportedContexts: ['personal', 'business'],
      },
      { requireExplicitScope: true }
    );
    expect(result.errors.some((e) => e.includes('must not include business'))).toBe(true);
  });

  it('requires explicit moduleScope for third-party certification mode', () => {
    const result = validateModuleScopeManifest(
      { supportedContexts: ['business'] },
      { requireExplicitScope: true }
    );
    expect(result.errors.some((e) => e.includes('moduleScope is required'))).toBe(true);
  });

  it('infers scope from supportedContexts at runtime', () => {
    expect(inferModuleScopeFromContexts(['personal', 'business'])).toBe('both');
    expect(inferModuleScopeFromContexts(['business'])).toBe('business');
  });

  it('rejects business install for personal-only module', () => {
    const check = assertModuleInstallScopeAllowed({
      moduleId: 'partner-crm',
      manifest: { moduleScope: 'personal', supportedContexts: ['personal'] },
      installScope: 'business',
    });
    expect(check.allowed).toBe(false);
    expect(check.moduleScope).toBe('personal');
  });

  it('rejects personal install for business-only module', () => {
    const check = assertModuleInstallScopeAllowed({
      moduleId: 'partner-hr',
      manifest: { moduleScope: 'business', supportedContexts: ['business'] },
      installScope: 'personal',
    });
    expect(check.allowed).toBe(false);
  });

  it('rejects marketplace install for internal modules', () => {
    const check = assertModuleInstallScopeAllowed({
      moduleId: 'platform-internal',
      manifest: { moduleScope: 'internal', supportedContexts: [] },
      installScope: 'personal',
    });
    expect(check.allowed).toBe(false);
  });

  it('filters marketplace visibility by scope', () => {
    expect(moduleScopeVisibleInMarketplace('internal', 'personal')).toBe(false);
    expect(moduleScopeVisibleInMarketplace('business', 'personal')).toBe(false);
    expect(moduleScopeVisibleInMarketplace('both', 'personal')).toBe(true);
    expect(moduleScopeVisibleInMarketplace('both', 'business')).toBe(true);
    expect(moduleScopeSupportsInstall('both', 'business')).toBe(true);
  });

  it('uses built-in scope map for hr', () => {
    expect(builtInModuleAvailableForPersonalScope('hr')).toBe(false);
    expect(builtInModuleAvailableForPersonalScope('drive')).toBe(true);
    const result = validateModuleScopeManifest({}, { moduleId: 'hr' });
    expect(result.moduleScope).toBe('business');
  });

  it('hides platform modules from module manager catalog', () => {
    expect(
      isModuleManagerVisible(
        'dashboard',
        { moduleScope: 'internal', supportedContexts: [] },
        'personal'
      )
    ).toBe(false);
    expect(
      isModuleManagerVisible(
        'drive',
        { moduleScope: 'both', supportedContexts: ['personal', 'business'] },
        'personal'
      )
    ).toBe(true);
    expect(
      isMarketplaceCatalogVisible(
        'drive',
        { moduleScope: 'both', supportedContexts: ['personal', 'business'] },
        'personal'
      )
    ).toBe(false);
    expect(
      isMarketplaceCatalogVisible(
        'todo',
        { moduleScope: 'both', supportedContexts: ['personal', 'business'] },
        'personal'
      )
    ).toBe(true);
  });

  it('validates sub-capability contexts are subset of manifest contexts', () => {
    const err = validateSubCapabilityContexts(
      ['business'],
      ['personal'],
      'searchDelegate'
    );
    expect(err).toContain('searchDelegate');
  });
});
