import { describe, expect, it, vi } from 'vitest';
import * as queryService from '../platformActivityQueryService';
import { getUnifiedTimelineForUser } from '../platformTimelineReadService';

vi.mock('../platformActivityQueryService', () => ({
  getFeedForUser: vi.fn(),
}));

describe('platformTimelineReadService', () => {
  it('getUnifiedTimelineForUser delegates to getFeedForUser', async () => {
    vi.mocked(queryService.getFeedForUser).mockResolvedValue([]);

    await getUnifiedTimelineForUser({
      userId: 'u1',
      dashboardId: 'dash-1',
      businessId: 'biz-1',
      limit: 25,
    });

    expect(queryService.getFeedForUser).toHaveBeenCalledWith({
      userId: 'u1',
      dashboardId: 'dash-1',
      businessId: 'biz-1',
      householdId: undefined,
      limit: 25,
    });
  });
});
