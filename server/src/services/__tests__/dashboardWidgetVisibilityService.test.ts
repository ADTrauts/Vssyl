import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as dashboardPolicyDual from '../../auth/dashboardPolicyDual';
import { searchAccessibleDashboardWidgets } from '../dashboardWidgetVisibilityService';

describe('searchAccessibleDashboardWidgets', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dashboardPolicyDual, 'evaluateDashboardPolicyDual').mockResolvedValue({
      blocked: false,
    });
  });

  it('returns empty for short queries', async () => {
    const results = await searchAccessibleDashboardWidgets({
      userId: 'u1',
      query: 'a',
    });
    expect(results).toEqual([]);
  });

  it('returns quick note hits from widget config', async () => {
    vi.spyOn(prisma.widget, 'findMany').mockResolvedValue([
      {
        id: 'w1',
        type: 'quicknotes',
        config: {
          notes: [{ id: 'n1', content: 'Meeting agenda for Monday', updatedAt: new Date().toISOString() }],
        },
        updatedAt: new Date(),
        dashboard: { id: 'd1', businessId: null, householdId: null, updatedAt: new Date() },
      },
    ] as never);

    const results = await searchAccessibleDashboardWidgets({
      userId: 'u1',
      query: 'agenda',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: 'quick_note',
      id: 'n1',
      widgetType: 'quicknotes',
      dashboardId: 'd1',
    });
  });

  it('returns bookmark hits from widget config', async () => {
    vi.spyOn(prisma.widget, 'findMany').mockResolvedValue([
      {
        id: 'w2',
        type: 'bookmarks',
        config: {
          bookmarks: [{ id: 'b1', title: 'Vssyl Docs', url: 'https://vssyl.com/docs' }],
        },
        updatedAt: new Date(),
        dashboard: { id: 'd1', businessId: null, householdId: null, updatedAt: new Date() },
      },
    ] as never);

    const results = await searchAccessibleDashboardWidgets({
      userId: 'u1',
      query: 'vssyl',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: 'bookmark',
      id: 'b1',
      title: 'Vssyl Docs',
    });
  });

  it('filters dashboards blocked by policy engine', async () => {
    vi.spyOn(prisma.widget, 'findMany').mockResolvedValue([
      {
        id: 'w1',
        type: 'quicknotes',
        config: { notes: [{ id: 'n1', content: 'secret note' }] },
        updatedAt: new Date(),
        dashboard: { id: 'd1', businessId: null, householdId: null, updatedAt: new Date() },
      },
    ] as never);
    vi.spyOn(dashboardPolicyDual, 'evaluateDashboardPolicyDual').mockResolvedValue({
      blocked: true,
    });

    const results = await searchAccessibleDashboardWidgets({
      userId: 'u1',
      query: 'secret',
    });

    expect(results).toEqual([]);
  });
});
