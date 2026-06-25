import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as hrVisibility from '../hrVisibilityService';
import * as schedulingVisibility from '../schedulingVisibilityService';
import * as workforceVisibility from '../workforceVisibilityService';
import * as notesVisibility from '../notes/notesVisibilityService';
import * as searchPolicyDual from '../../auth/searchPolicyDual';
import * as searchProviderRegistry from '../search/searchProviderRegistry';
import { executeGlobalSearch } from '../searchCapabilityService';

describe('executeGlobalSearch Wave 2 cross-module discovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(searchPolicyDual, 'evaluateSearchPolicyDual').mockResolvedValue({ blocked: false });
    const wave2Providers = searchProviderRegistry
      .getRegisteredSearchProviders()
      .filter((p) =>
        ['hr', 'scheduling', 'workforce_comms', 'notebook'].includes(p.providerId)
      );
    vi.spyOn(searchProviderRegistry, 'getReadySearchProviders').mockReturnValue(wave2Providers);
    vi.spyOn(hrVisibility, 'searchAccessibleHrEntities').mockResolvedValue([
      {
        entityType: 'employee_profile',
        id: 'hr-1',
        title: 'Alice',
        description: 'Engineer',
        businessId: 'biz-1',
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(schedulingVisibility, 'searchAccessibleScheduling').mockResolvedValue([
      {
        entityType: 'shift',
        id: 'shift-1',
        title: 'Tuesday opener',
        description: 'Week 12',
        businessId: 'biz-1',
        scheduleId: 'sched-1',
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(workforceVisibility, 'searchAccessibleWorkforceComms').mockResolvedValue([
      {
        entityType: 'communication',
        id: 'comm-1',
        title: 'Safety briefing',
        description: 'Announcement',
        businessId: 'biz-1',
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(notesVisibility, 'searchAccessiblePages').mockResolvedValue([
      {
        id: 'page-1',
        title: 'Ops notebook',
        content: 'Weekly ops notes',
        tags: [],
        pinned: false,
        dashboardId: 'dash-1',
        businessId: 'biz-1',
        folderId: null,
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date(),
        isOwner: true,
      },
    ]);
  });

  it('merges HR, scheduling, workforce, and notebook providers in one query', async () => {
    const result = await executeGlobalSearch({
      userId: 'u1',
      query: 'ops',
      filters: { context: { businessId: 'biz-1', dashboardId: 'dash-1' } },
    });

    const moduleIds = new Set(result.results.map((r) => r.moduleId));
    expect(moduleIds.has('hr')).toBe(true);
    expect(moduleIds.has('scheduling')).toBe(true);
    expect(moduleIds.has('workforce_comms')).toBe(true);
    expect(moduleIds.has('notebook')).toBe(true);
    expect(result.meta.providersInvoked).toEqual(
      expect.arrayContaining(['hr', 'scheduling', 'workforce_comms', 'notebook'])
    );
  });
});
