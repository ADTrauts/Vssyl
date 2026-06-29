import { describe, expect, it } from 'vitest';
import {
  filterAssignableModulesForTabPicker,
  filterModulesForDashboardPicker,
  manifestHasSettings,
  moduleSupportsConfiguration,
  resolveApplicationLifecycleCapabilities,
} from '../applicationLifecycle';
import { dashboardUsesModule, findPersonalDashboardAssignments } from '../dashboardAssignment';
import type { Dashboard } from 'shared/types';
import { isVisibleInMarketplace } from 'shared/types';

describe('applicationLifecycle', () => {
  it('detects configuration support from manifest settings', () => {
    expect(
      moduleSupportsConfiguration({
        id: 'todo',
        manifest: { settings: { defaultList: { type: 'string', default: '', description: '' } } } as never,
      })
    ).toBe(true);
    expect(moduleSupportsConfiguration({ id: 'notes', manifest: { settings: {} } as never })).toBe(
      false
    );
  });

  it('filters dashboard picker to installed assignable apps only', () => {
    const modules = [
      { id: 'dashboard', status: 'installed' as const, moduleScope: 'internal' as const },
      { id: 'drive', status: 'installed' as const, moduleScope: 'both' as const },
      { id: 'todo', status: 'installed' as const, moduleScope: 'both' as const },
      { id: 'crm', status: 'available' as const, moduleScope: 'both' as const },
    ];

    const picker = filterModulesForDashboardPicker(modules, 'personal');
    expect(picker.map((m) => m.id)).toEqual(['drive', 'todo']);

    const assignable = filterAssignableModulesForTabPicker(modules, 'personal');
    expect(assignable.map((m) => m.id)).toEqual(['todo']);
  });

  it('hides configure when no settings exist', () => {
    const caps = resolveApplicationLifecycleCapabilities(
      { id: 'notes', status: 'installed', manifest: { settings: {} } as never },
      'personal'
    );
    expect(caps.canConfigure).toBe(false);
    expect(caps.canAssignToDashboard).toBe(true);
    expect(caps.canUninstall).toBe(true);
  });

  it('keeps core apps locked from uninstall', () => {
    const caps = resolveApplicationLifecycleCapabilities(
      { id: 'chat', status: 'installed', isBuiltIn: true },
      'personal'
    );
    expect(caps.canUninstall).toBe(false);
  });

  it('marketplace never shows platform capabilities', () => {
    for (const id of ['dashboard', 'vlink', 'place']) {
      expect(isVisibleInMarketplace(id, 'internal', 'personal')).toBe(false);
    }
  });
});

describe('dashboardAssignment', () => {
  const dashboards: Dashboard[] = [
    {
      id: 'd1',
      userId: 'u1',
      name: 'Personal',
      widgets: [],
      preferences: { selectedModuleIds: ['drive', 'chat', 'calendar', 'todo'] },
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd2',
      userId: 'u1',
      name: 'Health',
      widgets: [],
      preferences: { selectedModuleIds: ['drive', 'chat', 'calendar', 'notes'] },
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('tracks module membership via selectedModuleIds independently from install', () => {
    expect(dashboardUsesModule(dashboards[0], 'todo')).toBe(true);
    expect(dashboardUsesModule(dashboards[1], 'todo')).toBe(false);
    expect(dashboardUsesModule(dashboards[1], 'notes')).toBe(true);
  });

  it('summarizes dashboard assignments for uninstall warnings', () => {
    const refs = findPersonalDashboardAssignments(dashboards, 'todo');
    expect(refs.filter((r) => r.isAssigned).map((r) => r.dashboardName)).toEqual(['Personal']);
  });
});
