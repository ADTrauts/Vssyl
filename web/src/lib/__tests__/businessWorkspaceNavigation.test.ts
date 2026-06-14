import { describe, expect, it } from 'vitest';
import {
  buildBusinessWorkspaceModuleHref,
  contractForSegment,
  hasNestedWorkspaceRoute,
  isLegacyQueryModuleHref,
  parseWorkspaceHrefSegment,
  resolveBusinessWorkspaceModule,
  resolveFirstWorkspaceSegment,
  shouldRenderWorkspaceChildren,
} from '../businessWorkspaceNavigation';
import {
  BUSINESS_WORKSPACE_SWITCH_CONTRACTS,
  REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS,
  businessWorkspaceMountedModuleIds,
  businessWorkspaceSwitchCaseIds,
  normalizeWorkspaceModuleId,
} from '../businessWorkspaceContracts';

const BUSINESS_ID = 'biz-test-001';

function searchParams(module: string | null) {
  return module ? { get: (key: string) => (key === 'module' ? module : null) } : { get: () => null };
}

describe('businessWorkspaceNavigation', () => {
  describe('resolveBusinessWorkspaceModule', () => {
    it('resolves hub default to dashboard', () => {
      expect(resolveBusinessWorkspaceModule('/business/x/workspace', searchParams(null))).toBe('dashboard');
    });

    it('resolves legacy query module on hub', () => {
      expect(resolveBusinessWorkspaceModule('/business/x/workspace', searchParams('drive'))).toBe('drive');
    });

    it('resolves segment paths for mounted modules', () => {
      for (const id of businessWorkspaceMountedModuleIds()) {
        if (id === 'dashboard') continue;
        const contract = BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find((c) => c.moduleId === id);
        const segment = contract?.segment ?? id;
        expect(resolveBusinessWorkspaceModule(`/business/x/workspace/${segment}`, searchParams(null))).toBe(
          id === 'members' ? 'members' : id === 'notebook' ? 'notebook' : id
        );
      }
    });

    it('normalizes connections and notes segments', () => {
      expect(resolveBusinessWorkspaceModule('/business/x/workspace/connections', searchParams(null))).toBe('members');
      expect(resolveBusinessWorkspaceModule('/business/x/workspace/notes', searchParams(null))).toBe('notebook');
    });

    it('resolves nested hr path to hr', () => {
      expect(resolveBusinessWorkspaceModule('/business/x/workspace/hr/team', searchParams(null))).toBe('hr');
    });
  });

  describe('buildBusinessWorkspaceModuleHref', () => {
    it('emits segment URLs for all mounted modules (no duplicate routes)', () => {
      const hrefs = businessWorkspaceMountedModuleIds().map((id) =>
        buildBusinessWorkspaceModuleHref(BUSINESS_ID, id)
      );
      const unique = new Set(hrefs);
      expect(unique.size).toBe(hrefs.length);
    });

    it('uses hub path for dashboard', () => {
      expect(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'dashboard')).toBe(
        `/business/${BUSINESS_ID}/workspace`
      );
      expect(isLegacyQueryModuleHref(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'dashboard'))).toBe(false);
    });

    it('uses segment paths for product modules', () => {
      expect(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'drive')).toBe(
        `/business/${BUSINESS_ID}/workspace/drive`
      );
      expect(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'members')).toBe(
        `/business/${BUSINESS_ID}/workspace/members`
      );
      expect(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'connections')).toBe(
        `/business/${BUSINESS_ID}/workspace/members`
      );
      expect(buildBusinessWorkspaceModuleHref(BUSINESS_ID, 'notes')).toBe(
        `/business/${BUSINESS_ID}/workspace/notebook`
      );
    });

    it('round-trips: href segment resolves to canonical module', () => {
      for (const id of businessWorkspaceMountedModuleIds()) {
        if (id === 'dashboard') continue;
        const href = buildBusinessWorkspaceModuleHref(BUSINESS_ID, id);
        const segment = parseWorkspaceHrefSegment(href);
        expect(segment).toBeTruthy();
        const resolved = resolveBusinessWorkspaceModule(href, searchParams(null));
        expect(normalizeWorkspaceModuleId(resolved)).toBe(id);
      }
    });
  });

  describe('shouldRenderWorkspaceChildren', () => {
    it('renders children for segment-page modules', () => {
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/members`)).toBe(true);
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/analytics`)).toBe(true);
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/notebook`)).toBe(true);
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/hr`)).toBe(true);
    });

    it('renders children for nested paths', () => {
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/hr/team`)).toBe(true);
      expect(hasNestedWorkspaceRoute(`/business/${BUSINESS_ID}/workspace/hr/team`)).toBe(true);
    });

    it('uses switch for segment-switch modules', () => {
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/drive`)).toBe(false);
      expect(shouldRenderWorkspaceChildren(`/business/${BUSINESS_ID}/workspace/chat`)).toBe(false);
    });
  });

  describe('contract coverage', () => {
    it('has no duplicate switch case ids', () => {
      const cases = businessWorkspaceSwitchCaseIds();
      expect(new Set(cases).size).toBe(cases.length);
    });

    it('maps every registry business module to a contract', () => {
      for (const id of REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS) {
        const contract = BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find((c) => c.moduleId === id);
        expect(contract, `missing contract for ${id}`).toBeDefined();
        expect(contract?.switchMounted).toBe(true);
      }
    });

    it('maps segments to contracts', () => {
      for (const contract of BUSINESS_WORKSPACE_SWITCH_CONTRACTS) {
        if (!contract.segment) continue;
        expect(contractForSegment(contract.segment)?.moduleId).toBe(contract.moduleId);
      }
    });
  });
});
