import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import {
  getFeedForUser,
  getModuleActivity,
  getRecentActivity,
  getActivityForEntity,
  parseModuleActivityLogRow,
} from '../platformActivityQueryService';

function sampleEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'evt_test_1',
    timestamp: '2026-06-22T12:00:00.000Z',
    actor: { userId: 'u1' },
    action: 'create',
    target: { type: 'file', id: 'file-1' },
    context: { moduleId: 'drive', dashboardId: 'dash-1' },
    metadata: { fileName: 'report.pdf' },
    ...overrides,
  };
}

describe('platformActivityQueryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseModuleActivityLogRow', () => {
    it('parses a valid module_activity_event envelope', () => {
      const record = parseModuleActivityLogRow({
        id: 'log-1',
        userId: 'u1',
        timestamp: new Date('2026-06-22T12:00:00.000Z'),
        module: 'drive',
        metadata: sampleEnvelope(),
      });

      expect(record).toMatchObject({
        logId: 'log-1',
        eventId: 'evt_test_1',
        moduleId: 'drive',
        action: 'create',
        targetType: 'file',
        targetId: 'file-1',
        dashboardId: 'dash-1',
        actorUserId: 'u1',
      });
    });

    it('returns null for invalid envelope', () => {
      expect(
        parseModuleActivityLogRow({
          id: 'log-2',
          userId: 'u1',
          timestamp: new Date(),
          module: 'drive',
          metadata: { action: 'only-action' },
        })
      ).toBeNull();
    });
  });

  describe('getFeedForUser', () => {
    it('queries module_activity_event logs and filters by dashboard', async () => {
      const findMany = vi.spyOn(prisma.log, 'findMany').mockResolvedValue([
        {
          id: 'log-a',
          userId: 'u1',
          timestamp: new Date('2026-06-22T13:00:00.000Z'),
          module: 'drive',
          metadata: sampleEnvelope({ context: { moduleId: 'drive', dashboardId: 'dash-1' } }),
        },
        {
          id: 'log-b',
          userId: 'u1',
          timestamp: new Date('2026-06-22T14:00:00.000Z'),
          module: 'todo',
          metadata: sampleEnvelope({
            action: 'complete',
            target: { type: 'task', id: 't-1' },
            context: { moduleId: 'todo', dashboardId: 'other-dash' },
          }),
        },
      ] as never);

      const results = await getFeedForUser({
        userId: 'u1',
        dashboardId: 'dash-1',
        limit: 10,
      });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u1',
            operation: 'module_activity_event',
          }),
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.moduleId).toBe('drive');
    });
  });

  describe('getRecentActivity', () => {
    it('returns time-bounded normalized records', async () => {
      vi.spyOn(prisma.log, 'findMany').mockResolvedValue([
        {
          id: 'log-c',
          userId: 'u1',
          timestamp: new Date('2026-06-22T10:00:00.000Z'),
          module: 'chat',
          metadata: sampleEnvelope({
            action: 'message',
            target: { type: 'message', id: 'm-1' },
            context: { moduleId: 'chat' },
          }),
        },
      ] as never);

      const since = new Date('2026-06-21T00:00:00.000Z');
      const results = await getRecentActivity({
        userId: 'u1',
        since,
        limit: 20,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.moduleId).toBe('chat');
    });
  });

  describe('getModuleActivity', () => {
    it('scopes by moduleId', async () => {
      const findMany = vi.spyOn(prisma.log, 'findMany').mockResolvedValue([] as never);

      await getModuleActivity({
        userId: 'u1',
        moduleId: 'todo',
        since: new Date('2026-06-01'),
      });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            module: 'todo',
          }),
        })
      );
    });
  });

  describe('getActivityForEntity', () => {
    it('filters normalized records by target type and id', async () => {
      vi.spyOn(prisma.log, 'findMany').mockResolvedValue([
        {
          id: 'log-a',
          userId: 'u1',
          timestamp: new Date('2026-06-22T12:00:00.000Z'),
          module: 'drive',
          metadata: sampleEnvelope(),
        },
        {
          id: 'log-b',
          userId: 'u1',
          timestamp: new Date('2026-06-22T11:00:00.000Z'),
          module: 'drive',
          metadata: sampleEnvelope({
            target: { type: 'file', id: 'file-other' },
          }),
        },
      ] as never);

      const results = await getActivityForEntity({
        userId: 'u1',
        moduleId: 'drive',
        targetType: 'file',
        targetId: 'file-1',
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.targetId).toBe('file-1');
    });
  });
});
