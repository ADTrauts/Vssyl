import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import { recordTaskCreated, recordTaskTrashed } from '../todoActivityService';

describe('todoActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
  });

  it('recordTaskCreated emits module activity', async () => {
    await recordTaskCreated({
      actorUserId: 'u1',
      task: {
        id: 't1',
        title: 'Task',
        dashboardId: 'd1',
        businessId: null,
        householdId: null,
        createdById: 'u1',
        status: 'TODO',
      },
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'todo',
        action: 'create',
        targetId: 't1',
      })
    );
  });

  it('recordTaskTrashed emits soft-delete activity', async () => {
    await recordTaskTrashed({
      actorUserId: 'u1',
      task: {
        id: 't1',
        title: 'Task',
        dashboardId: 'd1',
        businessId: null,
        householdId: null,
        createdById: 'u1',
      },
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete',
        metadata: { softDelete: true },
      })
    );
  });
});
