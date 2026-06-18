import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_MODULE_DEFINITIONS } from '../../runtime/modules/coreModuleRegistry';
import {
  getModuleDefinition,
  getModulesForContext,
  isInstallableProductModule,
  NON_INSTALLABLE_MODULE_IDS,
} from '../../runtime/modules/moduleRegistry';
import { MODULES } from '../../config/modules';

const WEB_ROOT = join(__dirname, '../..');

describe('adminPortalRegistryCleanup (AP-F-009)', () => {
  it('excludes admin from non-installable module ids', () => {
    expect(NON_INSTALLABLE_MODULE_IDS.has('admin')).toBe(true);
    expect(isInstallableProductModule('admin')).toBe(false);
  });

  it('does not register admin in core module definitions', () => {
    const ids = CORE_MODULE_DEFINITIONS.map((m) => m.id);
    expect(ids).not.toContain('admin');
  });

  it('does not expose admin as an installable product module in workspace contexts', () => {
    for (const context of ['personal', 'business', 'household', 'education'] as const) {
      const ids = getModulesForContext(context).map((m) => m.id);
      expect(ids, `admin surfaced in ${context} context`).not.toContain('admin');
    }
  });

  it('does not define admin in legacy MODULES config', () => {
    expect(MODULES.map((m) => m.id)).not.toContain('admin');
  });

  it('still includes real product modules in the registry', () => {
    expect(getModuleDefinition('drive')).toBeDefined();
    expect(getModuleDefinition('chat')).toBeDefined();
    expect(getModuleDefinition('hr')).toBeDefined();
    expect(getModulesForContext('business').map((m) => m.id)).toContain('hr');
  });

  it('normalizeModuleId still maps admin for legacy references without registry entry', () => {
    expect(getModuleDefinition('admin')).toBeUndefined();
  });
});

describe('adminPortalDuplicateSurfaceCleanup (AP-F-010)', () => {
  it('/modules/admin redirects to canonical admin portal modules surface', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/modules/admin/page.tsx'), 'utf8');
    expect(source).toContain("redirect('/admin-portal/modules')");
    expect(source).not.toContain('getModuleSubmissions');
    expect(source).not.toContain('reviewModuleSubmission');
  });

  it('module marketplace links to canonical governance surface', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/modules/page.tsx'), 'utf8');
    expect(source).toContain('/admin-portal/modules');
    expect(source).not.toContain('/modules/admin');
  });
});

describe('adminPortalDocumentationHygiene (AP-F-028)', () => {
  it('ADMIN_PORTAL guide does not claim mock-first data implementation', () => {
    const source = readFileSync(join(__dirname, '../../../../docs/guides/ADMIN_PORTAL.md'), 'utf8');
    expect(source).not.toContain('Mock data implementation');
    expect(source).toContain('control plane');
    expect(source).toContain('ADMIN_PORTAL_DEBUG_ENABLED');
    expect(source).toContain('ADMIN_PORTAL_DANGEROUS_OPS_ENABLED');
    expect(source).toContain('/admin-portal/modules');
    expect(source).toContain('/modules/admin');
  });
});
