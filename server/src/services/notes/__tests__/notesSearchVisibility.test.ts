import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as notesPolicyDual from '../notesPolicyDual';
import { searchAccessiblePages } from '../notesVisibilityService';

describe('searchAccessiblePages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notesPolicyDual, 'evaluateNotesPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('returns empty when dashboard tenant mismatches business context', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      businessId: 'biz-a',
      householdId: null,
    } as never);
    const findManySpy = vi.spyOn(prisma.note, 'findMany').mockResolvedValue([] as never);

    const results = await searchAccessiblePages({
      userId: 'u1',
      query: 'notes',
      dashboardId: 'dash-1',
      businessId: 'biz-b',
    });

    expect(results).toEqual([]);
    expect(findManySpy).not.toHaveBeenCalled();
  });

  it('searches owned and shared pages with text filter', async () => {
    vi.spyOn(prisma.note, 'findMany').mockResolvedValue([
      {
        id: 'n1',
        title: 'Meeting notes',
        content: 'body',
        tags: [],
        pinned: false,
        dashboardId: 'dash-1',
        businessId: null,
        folderId: null,
        createdById: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const results = await searchAccessiblePages({
      userId: 'u1',
      query: 'meeting',
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Meeting notes');
  });
});
