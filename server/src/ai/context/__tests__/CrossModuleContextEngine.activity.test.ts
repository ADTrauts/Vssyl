import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrossModuleContextEngine } from '../CrossModuleContextEngine';
import * as timelineService from '../../../services/platform/platformTimelineReadService';

vi.mock('../../../services/platform/platformTimelineReadService', () => ({
  getUnifiedTimelineForUser: vi.fn(),
}));

describe('CrossModuleContextEngine activity reads (ACT-R1 P1)', () => {
  const engine = new CrossModuleContextEngine();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses platformActivityQueryService for activity context', async () => {
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

    // getUserContext internally calls private getActivityContext
    const context = await engine.getUserContext('u1');

    expect(timelineService.getUnifiedTimelineForUser).toHaveBeenCalledWith({
      userId: 'u1',
      limit: 100,
    });
    expect(context.patterns).toBeDefined();
    expect(context.currentFocus).toBeDefined();
  });
});
