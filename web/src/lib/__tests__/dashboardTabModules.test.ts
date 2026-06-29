import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Dashboard } from 'shared/types';
import {
  buildDefaultLeftSidebarFromSelected,
  DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS,
  DASHBOARD_TAB_CORE_MODULE_IDS,
  DASHBOARD_TAB_IMPLICIT_MODULE_ID,
  extractModuleIdsFromSidebarConfig,
  filterModulesForTab,
  getMainPersonalDashboardId,
  normalizeSelectedModuleIds,
  resolveSelectedModuleIds,
} from '../dashboardTabModules';

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
});

describe('DashboardLayoutInner integration', () => {
  it('uses dashboard tab module helpers for sidebar membership', () => {
    const innerPath = join(__dirname, '../../app/dashboard/DashboardLayoutInner.tsx');
    const content = readFileSync(innerPath, 'utf8');
    expect(content).toContain('resolveSelectedModuleIds');
    expect(content).toContain('filterModulesForTab');
    expect(content).toContain('buildDefaultLeftSidebarFromSelected');
  });
});
