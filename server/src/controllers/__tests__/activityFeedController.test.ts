import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getActivityFeed } from '../activityFeedController';
import * as timelineService from '../../services/platform/platformTimelineReadService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/platform/platformTimelineReadService', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../../services/platform/platformTimelineReadService')
  >();
  return {
    ...actual,
    getUnifiedTimelineForUser: vi.fn(),
  };
});

describe('activityFeedController (ACT-R1 Wave 1)', () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const res = { status, json } as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
    json.mockReset();
    status.mockClear();
  });

  it('returns 401 without user', async () => {
    const req = { user: undefined, query: {} } as unknown as Request;
    await getActivityFeed(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('delegates feed to platform timeline read service', async () => {
    vi.mocked(timelineService.getUnifiedTimelineForUser).mockResolvedValue([
      {
        logId: 'log-1',
        eventId: 'evt-1',
        timestamp: new Date('2026-06-22T12:00:00.000Z'),
        moduleId: 'todo',
        action: 'complete',
        targetType: 'task',
        targetId: 'task-1',
        metadata: { title: 'Ship ACT-R1' },
        actorUserId: 'u1',
      },
    ]);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'u1',
      name: 'Tester',
      email: 't@test.com',
    } as never);

    const req = {
      user: { id: 'u1' },
      query: { limit: '10' },
    } as unknown as Request;

    await getActivityFeed(req, res);

    expect(timelineService.getUnifiedTimelineForUser).toHaveBeenCalledWith({
      userId: 'u1',
      dashboardId: undefined,
      businessId: undefined,
      householdId: undefined,
      limit: 10,
    });
    expect(json).toHaveBeenCalledWith({
      activities: [
        expect.objectContaining({
          module: 'todo',
          action: 'complete',
          metadata: expect.objectContaining({ source: 'normalized_event' }),
        }),
      ],
    });
  });

  it('returns 403 when businessId is not accessible', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

    const req = {
      user: { id: 'u1' },
      query: { businessId: 'biz-1' },
    } as unknown as Request;

    await getActivityFeed(req, res);

    expect(status).toHaveBeenCalledWith(403);
    expect(timelineService.getUnifiedTimelineForUser).not.toHaveBeenCalled();
  });
});
