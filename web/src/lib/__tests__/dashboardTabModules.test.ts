import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Dashboard } from 'shared/types';
import {
  buildDashboardTabBuildOutState,
  buildDefaultLeftSidebarFromSelected,
  buildDashboardRenameRequest,
  DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS,
  DASHBOARD_TAB_CORE_MODULE_IDS,
  DASHBOARD_TAB_IMPLICIT_MODULE_ID,
  extractModuleIdsFromSidebarConfig,
  filterModulesForTab,
  getMainPersonalDashboardId,
  mergeSelectedModuleIds,
  normalizeSelectedModuleIds,
  pruneDashboardTabStateToSelectedModules,
  pruneLeftSidebarConfigToSelectedModules,
  pruneSidebarCustomizationToSelectedModules,
  resolveSelectedModuleIds,
} from '../dashboardTabModules';
import type { SidebarCustomization } from '../../types/sidebar';

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: 'dash-1',
    userId: 'user-1',
    name: 'Test',
    widgets: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function allModuleIdsFromSidebar(config: ReturnType<typeof buildDefaultLeftSidebarFromSelected>): string[] {
  return extractModuleIdsFromSidebarConfig(config);
}

describe('dashboardTabModules', () => {
  describe('normalizeSelectedModuleIds', () => {
    it('always includes dashboard and core modules', () => {
      expect(normalizeSelectedModuleIds([])).toEqual([
        DASHBOARD_TAB_IMPLICIT_MODULE_ID,
        ...DASHBOARD_TAB_CORE_MODULE_IDS,
      ]);
    });

    it('dedupes and keeps core even when omitted from input', () => {
      expect(normalizeSelectedModuleIds(['todo', 'drive', 'todo'])).toEqual([
        DASHBOARD_TAB_IMPLICIT_MODULE_ID,
        ...DASHBOARD_TAB_CORE_MODULE_IDS,
        'todo',
      ]);
    });

    it('does not treat dashboard as user-selected extra', () => {
      const result = normalizeSelectedModuleIds(['dashboard', 'notebook']);
      expect(result.filter((id) => id === 'dashboard').length).toBe(1);
      expect(result).toContain('notebook');
    });
  });

  describe('buildDefaultLeftSidebarFromSelected', () => {
    it('core-only tab sidebar contains only selected modules', () => {
      const selected = normalizeSelectedModuleIds([]);
      const config = buildDefaultLeftSidebarFromSelected(selected, 'personal');
      const ids = allModuleIdsFromSidebar(config);
      for (const id of ids) {
        expect(selected).toContain(id);
      }
      expect(ids).toContain('drive');
      expect(ids).toContain('chat');
      expect(ids).toContain('calendar');
      expect(ids).toContain('dashboard');
      expect(ids).not.toContain('todo');
      expect(ids).not.toContain('notebook');
    });

    it('main personal shape includes social folder and todo loose', () => {
      const selected = [...DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS];
      const config = buildDefaultLeftSidebarFromSelected(selected, 'personal');
      const ids = allModuleIdsFromSidebar(config);
      expect(ids.sort()).toEqual([...selected].sort());
      expect(config.folders.some((f) => f.id === 'social')).toBe(true);
      expect(config.looseModules.some((m) => m.id === 'todo')).toBe(true);
    });

    it('additional modules appear only when selected', () => {
      const selected = normalizeSelectedModuleIds(['notebook']);
      const config = buildDefaultLeftSidebarFromSelected(selected, 'personal');
      const ids = allModuleIdsFromSidebar(config);
      expect(ids).toContain('notebook');
      expect(ids).not.toContain('todo');
    });
  });

  describe('resolveSelectedModuleIds legacy fallback', () => {
    it('uses stored selectedModuleIds when present', () => {
      const dashboard = makeDashboard({
        preferences: { selectedModuleIds: ['drive', 'chat', 'calendar', 'notebook'] },
      });
      expect(resolveSelectedModuleIds(dashboard)).toContain('notebook');
    });

    it('main personal tab fallback matches DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS', () => {
      const dashboard = makeDashboard({ id: 'main-dash' });
      const resolved = resolveSelectedModuleIds(dashboard, { isMainPersonalTab: true });
      expect(resolved.sort()).toEqual([...DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS].sort());
    });

    it('non-main tab without prefs falls back to core plus widgets', () => {
      const dashboard = makeDashboard({
        id: 'new-tab',
        widgets: [{ id: 'w1', dashboardId: 'new-tab', type: 'notebook', createdAt: '', updatedAt: '' }],
      });
      const resolved = resolveSelectedModuleIds(dashboard, { isMainPersonalTab: false });
      expect(resolved).toContain('notebook');
      expect(resolved).not.toContain('todo');
    });
  });

  describe('filterModulesForTab', () => {
    it('returns intersection only', () => {
      const all = [
        { id: 'drive', name: 'Drive' },
        { id: 'chat', name: 'Chat' },
        { id: 'notebook', name: 'Notebook' },
        { id: 'todo', name: 'Todo' },
      ];
      const filtered = filterModulesForTab(all, normalizeSelectedModuleIds(['notebook']));
      expect(filtered.map((m) => m.id).sort()).toEqual(['chat', 'drive', 'notebook'].sort());
    });
  });

  describe('getMainPersonalDashboardId', () => {
    it('returns oldest personal dashboard by createdAt', () => {
      const id = getMainPersonalDashboardId([
        { id: 'b', createdAt: '2026-02-01T00:00:00.000Z' },
        { id: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
      ]);
      expect(id).toBe('a');
    });
  });

  describe('non-main tab fallback does not include all installed modules', () => {
    it('core-only legacy tab excludes unrelated installed modules', () => {
      const dashboard = makeDashboard({ id: 'minimal-tab', widgets: [] });
      const resolved = resolveSelectedModuleIds(dashboard, { isMainPersonalTab: false });
      expect(resolved.sort()).toEqual(
        normalizeSelectedModuleIds([]).sort()
      );
      expect(resolved).not.toContain('todo');
      expect(resolved).not.toContain('notebook');
      expect(resolved).not.toContain('connections');
    });
  });

  describe('prune helpers', () => {
    it('prunes sidebar config referencing unselected modules', () => {
      const config = buildDefaultLeftSidebarFromSelected(
        normalizeSelectedModuleIds(['notebook']),
        'personal'
      );
      config.looseModules.push({ id: 'todo', order: 99 });
      const pruned = pruneLeftSidebarConfigToSelectedModules(
        config,
        normalizeSelectedModuleIds(['notebook'])
      );
      const ids = extractModuleIdsFromSidebarConfig(pruned);
      expect(ids).not.toContain('todo');
      expect(ids).toContain('notebook');
    });

    it('pruneSidebarCustomizationToSelectedModules removes stray pinned modules', () => {
      const customization: SidebarCustomization = {
        leftSidebar: {
          'tab-1': buildDefaultLeftSidebarFromSelected(
            normalizeSelectedModuleIds([]),
            'personal'
          ),
        },
        rightSidebar: {
          personal: {
            context: 'personal',
            pinnedModules: [
              { id: 'drive', order: 0 },
              { id: 'todo', order: 1 },
            ],
          },
        },
      };
      const pruned = pruneSidebarCustomizationToSelectedModules(
        customization,
        normalizeSelectedModuleIds([])
      );
      expect(pruned.rightSidebar.personal.pinnedModules.map((m) => m.id)).toEqual([
        'drive',
      ]);
    });

    it('pruneDashboardTabStateToSelectedModules preserves locked core modules', () => {
      const result = pruneDashboardTabStateToSelectedModules({
        selectedModuleIds: ['drive'],
        widgetTypes: ['drive', 'todo', 'notebook'],
        sidebarCustomization: {
          leftSidebar: {},
          rightSidebar: {},
        },
      });
      expect(result.selectedModuleIds).toEqual(normalizeSelectedModuleIds(['drive']));
      expect(result.widgetTypes).toEqual(['drive']);
    });

    it('mergeSelectedModuleIds cannot remove locked core modules', () => {
      const merged = mergeSelectedModuleIds(
        normalizeSelectedModuleIds(['todo', 'notebook']),
        [],
        ['drive', 'chat', 'calendar', 'dashboard', 'todo']
      );
      expect(merged).toContain('drive');
      expect(merged).toContain('chat');
      expect(merged).toContain('calendar');
      expect(merged).toContain('dashboard');
      expect(merged).toContain('notebook');
      expect(merged).not.toContain('todo');
    });
  });

  describe('rename safety', () => {
    it('buildDashboardRenameRequest only includes name', () => {
      const req = buildDashboardRenameRequest('  Health Tab  ');
      expect(req).toEqual({ name: 'Health Tab' });
      expect('preferences' in req).toBe(false);
    });

    it('buildDashboardTabBuildOutState includes selectedModuleIds and sidebarCustomization immediately', () => {
      const dashboard = makeDashboard({ id: 'tab-new', widgets: [] });
      const { dashboard: hydrated, normalizedSelectedModuleIds, sidebarCustomization } =
        buildDashboardTabBuildOutState(dashboard, ['drive', 'chat', 'calendar', 'todo'], [
          { id: 'w1', type: 'todo', dashboardId: 'tab-new', config: {}, createdAt: '', updatedAt: '' },
        ]);

      expect(normalizedSelectedModuleIds).toEqual([
        'dashboard',
        'drive',
        'chat',
        'calendar',
        'todo',
      ]);
      expect(hydrated.preferences?.selectedModuleIds).toEqual(normalizedSelectedModuleIds);
      expect(sidebarCustomization.leftSidebar['tab-new']).toBeDefined();
      expect(hydrated.preferences?.sidebarCustomization).toEqual(sidebarCustomization);
      expect(resolveSelectedModuleIds(hydrated, { isMainPersonalTab: false })).toEqual(
        normalizedSelectedModuleIds
      );
      expect(hydrated.widgets).toHaveLength(1);
    });
  });
});

describe('WidgetPicker integration', () => {
  it('WidgetPicker accepts selectedModuleIds for tab-scoped filtering', () => {
    const path = join(__dirname, '../../components/dashboard/WidgetPicker.tsx');
    const content = readFileSync(path, 'utf8');
    expect(content).toContain('selectedModuleIds');
    expect(content).toContain('allowed.has(id)');
  });
});

describe('DashboardBuildOutModal personal tab UX', () => {
  it('opens directly to module selection for personal tabs', () => {
    const modalPath = join(__dirname, '../../components/DashboardBuildOutModal.tsx');
    const content = readFileSync(modalPath, 'utf8');
    expect(content).toContain("isPersonalScope ? 'custom' : 'quick-setup'");
    expect(content).toContain('getInstalledModules');
    expect(content).toContain('/modules?tab=marketplace');
    expect(content).toContain('isPersonalScope ? (');
    expect(content).toContain('moduleSelectionContent');
    expect(content).toContain('Core apps (included automatically)');
  });

  it('supports first-run persona onboarding branches', () => {
    const modalPath = join(__dirname, '../../components/DashboardBuildOutModal.tsx');
    const content = readFileSync(modalPath, 'utf8');
    expect(content).toContain('onboardingMode');
    expect(content).toContain("view === 'persona'");
    expect(content).toContain('I want to organize my own work.');
    expect(content).toContain('/business/create');
    expect(content).toContain('/auth/accept-invitation');
    expect(content).toContain('OnboardingHelpLinks');
  });
});

describe('DashboardClient integration', () => {
  it('hydrates dashboard and sidebar context after build-out', () => {
    const clientPath = join(__dirname, '../../app/dashboard/DashboardClient.tsx');
    const content = readFileSync(clientPath, 'utf8');
    expect(content).toContain('buildDashboardTabBuildOutState');
    expect(content).toContain('upsertDashboard(hydrated.dashboard)');
    expect(content).toContain('hydrateConfig(hydrated.sidebarCustomization');
    expect(content).toContain('vssyl-onboarding-persona-completed');
    expect(content).toContain('onboardingMode={showOnboardingMode}');
  });
});

describe('DashboardLayoutInner integration', () => {
  it('uses dashboard tab module helpers for sidebar membership', () => {
    const innerPath = join(__dirname, '../../app/dashboard/DashboardLayoutInner.tsx');
    const content = readFileSync(innerPath, 'utf8');
    expect(content).toContain('resolveSelectedModuleIds');
    expect(content).toContain('filterModulesForTab');
    expect(content).toContain('buildDefaultLeftSidebarFromSelected');
    expect(content).toContain('normalizeSelectedModuleIds');
  });
});
