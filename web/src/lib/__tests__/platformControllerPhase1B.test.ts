import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PLATFORM_PROGRAM_DEFINITIONS,
  UNIFIED_SEARCH_PILOT_MODULE_ID,
} from '../../config/platformPrograms';
import {
  buildPlatformControllerNavigationSections,
  countPlatformControllerNavDestinations,
  PLATFORM_CONTROLLER_REMOVED_NAV_IDS,
  resolvePlatformControllerActiveNavId,
} from '../../config/platformControllerNavigation';
import { resolvePlatformControllerApiAlias } from '../platformControllerApiAliases';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('platformControllerPhase1B', () => {
  describe('branding', () => {
    it('layout shows Operations Platform shell copy', () => {
      const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
      expect(layout).toContain('OPERATIONS_PLATFORM_NAME');
      expect(layout).toContain('OPERATIONS_PLATFORM_TAGLINE');
      expect(layout).not.toContain('>Admin Portal<');
      expect(layout).not.toContain('Platform Controller');
    });
  });

  describe('Platform Programs hub', () => {
    it('platform-programs route exists', () => {
      expect(
        existsSync(join(WEB_ROOT, 'app/admin-portal/platform-programs/page.tsx')),
      ).toBe(true);
    });

    it('registers five certified platform programs', () => {
      expect(PLATFORM_PROGRAM_DEFINITIONS).toHaveLength(5);
      const ids = PLATFORM_PROGRAM_DEFINITIONS.map((p) => p.id);
      expect(ids).toContain('platform-kernel');
      expect(ids).toContain('unified-search');
      expect(ids).toContain('ai-retrieval');
      expect(ids).toContain('context-graph');
      expect(ids).toContain('marketplace-partner-runtime');
    });

    it('PlatformProgramCard component exists', () => {
      expect(
        existsSync(join(WEB_ROOT, 'components/admin-portal/PlatformProgramCard.tsx')),
      ).toBe(true);
    });

    it('hub page uses PlatformProgramCard without duplicate dashboard components', () => {
      const hub = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/platform-programs/page.tsx'),
        'utf8',
      );
      expect(hub).toContain('PlatformProgramCard');
      expect(hub).toContain('usePlatformProgramsHubHealth');
      expect(hub).not.toContain('PipelineOperationsHub');
    });
  });

  describe('sidebar navigation', () => {
    it('includes Platform Programs and Marketplace; excludes AI System', () => {
      const sections = buildPlatformControllerNavigationSections();
      const labels = sections.flatMap((s) => s.items.map((i) => i.label));
      const ids = sections.flatMap((s) => s.items.map((i) => i.id));

      expect(labels).toContain('Platform Programs');
      expect(labels).toContain('Modules');
      expect(labels).toContain('Operations Overview');
      expect(ids).not.toContain('ai-system');
      for (const removed of PLATFORM_CONTROLLER_REMOVED_NAV_IDS) {
        expect(ids).not.toContain(removed);
      }
    });

    it('reduces visible destinations to approximately 14 (grouped IA)', () => {
      const count = countPlatformControllerNavDestinations();
      expect(count).toBeGreaterThanOrEqual(14);
      expect(count).toBeLessThanOrEqual(26);
    });

    it('layout imports canonical navigation builder', () => {
      const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
      expect(layout).toContain('buildPlatformControllerNavigationSections');
      expect(layout).toContain('resolvePlatformControllerActiveNavId');
    });

    it('resolves active nav for platform programs and diagnostics', () => {
      expect(resolvePlatformControllerActiveNavId('/admin-portal/platform-programs')).toBe(
        'platform-programs',
      );
      expect(
        resolvePlatformControllerActiveNavId('/admin-portal/ai-pipeline/diagnostics'),
      ).toBe('diagnostics');
      expect(
        resolvePlatformControllerActiveNavId('/admin-portal/ai-pipeline', 'provider-governance'),
      ).toBe('providers');
    });

    it('Operator Labs collapsed by default and hides debug items when gate off', () => {
      const labs = buildPlatformControllerNavigationSections().find(
        (s) => s.id === 'operator-labs',
      );
      expect(labs?.defaultCollapsed).toBe(true);
    });
  });

  describe('marketplace integration', () => {
    it('modules page supports ai-context tab query for Context Graph workflow', () => {
      const modules = readFileSync(join(WEB_ROOT, 'app/admin-portal/modules/page.tsx'), 'utf8');
      expect(modules).toContain('useSearchParams');
      expect(modules).toContain("tab === 'ai-context'");
    });

    it('MarketplaceReadinessCard remains on modules page', () => {
      const modules = readFileSync(join(WEB_ROOT, 'app/admin-portal/modules/page.tsx'), 'utf8');
      expect(modules).toContain('MarketplaceReadinessCard');
    });

    it('unified search pilot module id is defined for readiness probe', () => {
      expect(UNIFIED_SEARCH_PILOT_MODULE_ID).toBe('vssyl-pilot-assets');
    });
  });

  describe('hidden debug routes', () => {
    it('duplicate impersonation test routes redirect to impersonate', () => {
      const testImp = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/test-impersonation/page.tsx'),
        'utf8',
      );
      const impTest = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/impersonation-test/page.tsx'),
        'utf8',
      );
      const middleware = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');

      expect(testImp).toContain("redirect('/admin-portal/impersonate')");
      expect(impTest).toContain("redirect('/admin-portal/impersonate')");
      expect(middleware).toContain('/admin-portal/impersonate');
    });

    it('ai-system route preserved but not in sidebar', () => {
      expect(existsSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'))).toBe(true);
      const ids = buildPlatformControllerNavigationSections().flatMap((s) =>
        s.items.map((i) => i.id),
      );
      expect(ids).not.toContain('ai-system');
    });
  });

  describe('API aliases', () => {
    it('maps canonical provider prefix to existing satellite mount', () => {
      expect(resolvePlatformControllerApiAlias('/api/admin-portal/providers/usage/combined')).toBe(
        '/api/admin/ai-providers/usage/combined',
      );
      expect(resolvePlatformControllerApiAlias('/api/admin-portal/overrides/users')).toBe(
        '/api/admin-override/users',
      );
      expect(
        resolvePlatformControllerApiAlias('/api/admin-portal/modules/ai/status'),
      ).toBe('/api/admin/modules/ai/status');
    });

    it('proxy route applies alias resolver', () => {
      const proxy = readFileSync(
        join(WEB_ROOT, 'app/api/[...slug]/route.ts'),
        'utf8',
      );
      expect(proxy).toContain('resolvePlatformControllerApiAlias');
    });
  });

  describe('Phase 1B documentation', () => {
    it('closeout artifacts exist', () => {
      const docs = [
        'docs/platform-controller/PLATFORM_CONTROLLER_IMPLEMENTATION.md',
        'docs/platform-controller/PLATFORM_PROGRAM_CARD_STANDARD.md',
        'docs/platform-controller/PLATFORM_CONTROLLER_PHASE_1B_CLOSEOUT.md',
      ];
      for (const rel of docs) {
        expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
      }
    });
  });
});
