import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { notifyTaskAssigned } from '../todoNotificationService';

describe('todoNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({} as never);
  });

  it('notifyTaskAssigned creates todo_assigned notification for assignee', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Alice' } as never);

    await notifyTaskAssigned({
      actorUserId: 'u1',
      taskId: 't1',
      taskTitle: 'Review PR',
      dashboardId: 'd1',
      assigneeUserId: 'u2',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u2',
        type: 'todo_assigned',
        title: 'Task assigned to you',
      })
    );
  });

  it('skips notification when assignee is the actor', async () => {
    await notifyTaskAssigned({
      actorUserId: 'u1',
      taskId: 't1',
      taskTitle: 'Self assign',
      dashboardId: 'd1',
      assigneeUserId: 'u1',
    });

    expect(NotificationService.createNotification).not.toHaveBeenCalled();
  });
});
