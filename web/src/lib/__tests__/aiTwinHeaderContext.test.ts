import { describe, expect, it } from 'vitest';
import { resolveBusinessWorkspaceModule } from '../businessWorkspaceNavigation';
import { resolveHeaderTwinCurrentModule } from '../aiTwinHeaderContext';
import { resolvePersonalDashboardModule } from '../personalDashboardNavigation';

const searchParams = (module: string | null) =>
  module ? { get: (key: string) => (key === 'module' ? module : null) } : { get: () => null };

describe('resolveHeaderTwinCurrentModule', () => {
  it('prefers moduleContext module for scheduling extras', () => {
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: 'calendar',
        moduleContextModule: 'scheduling',
      })
    ).toBe('scheduling');
  });

  it('maps personal workspace resolver ids to Twin currentModule', () => {
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: resolvePersonalDashboardModule('/calendar') })).toBe(
      'calendar'
    );
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: resolvePersonalDashboardModule('/drive') })).toBe(
      'drive'
    );
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: resolvePersonalDashboardModule('/todo') })).toBe('todo');
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: resolvePersonalDashboardModule('/chat') })).toBe('chat');
  });

  it('maps business workspace resolver ids to Twin currentModule', () => {
    const biz = '/business/acme/workspace';
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/calendar`, searchParams(null)),
      })
    ).toBe('calendar');
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/drive`, searchParams(null)),
      })
    ).toBe('drive');
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/hr/team`, searchParams(null)),
      })
    ).toBe('hr');
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/scheduling`, searchParams(null)),
      })
    ).toBe('scheduling');
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/todo`, searchParams(null)),
      })
    ).toBe('todo');
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId: resolveBusinessWorkspaceModule(`${biz}/workforce-comms`, searchParams(null)),
      })
    ).toBe('workforce_comms');
  });

  it('falls back to search for non-module surfaces', () => {
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: 'dashboard' })).toBe('search');
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: resolvePersonalDashboardModule('/ai-chat') })).toBe(
      'search'
    );
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: null })).toBe('search');
    expect(resolveHeaderTwinCurrentModule({ workspaceModuleId: undefined })).toBe('search');
  });
});

describe('header twin currentModule matrix', () => {
  const cases: Array<{ label: string; workspaceModuleId: string | null; moduleContextModule?: string; expected: string }> =
    [
      { label: 'Personal Calendar', workspaceModuleId: 'calendar', expected: 'calendar' },
      { label: 'Personal Drive', workspaceModuleId: 'drive', expected: 'drive' },
      { label: 'Business Calendar', workspaceModuleId: 'calendar', expected: 'calendar' },
      { label: 'Business Drive', workspaceModuleId: 'drive', expected: 'drive' },
      { label: 'Business HR', workspaceModuleId: 'hr', expected: 'hr' },
      { label: 'Business Scheduling', workspaceModuleId: 'scheduling', moduleContextModule: 'scheduling', expected: 'scheduling' },
      { label: 'Todo', workspaceModuleId: 'todo', expected: 'todo' },
      { label: 'generic page', workspaceModuleId: 'dashboard', expected: 'search' },
    ];

  it.each(cases)('$label → $expected', ({ workspaceModuleId, moduleContextModule, expected }) => {
    expect(
      resolveHeaderTwinCurrentModule({
        workspaceModuleId,
        moduleContextModule,
      })
    ).toBe(expected);
  });
});
