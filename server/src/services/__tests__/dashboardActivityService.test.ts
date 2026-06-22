import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import {
  recordDashboardCreated,
  recordWidgetAdded,
  recordWidgetLayoutBatchUpdate,
} from '../dashboardActivityService';

describe('dashboardActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
  });

  it('recordDashboardCreated emits dashboard.create', async () => {
    await recordDashboardCreated({
      actorUserId: 'u1',
      dashboard: {
        id: 'd1',
        name: 'My Dashboard',
        businessId: null,
        householdId: null,
        institutionId: null,
      },
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'dashboard',
        action: 'dashboard.create',
        targetType: 'dashboard',
        targetId: 'd1',
      })
    );
  });

  it('recordWidgetAdded emits widget.add', async () => {
    await recordWidgetAdded({
      actorUserId: 'u1',
      widget: { id: 'w1', type: 'chat', dashboardId: 'd1' },
      dashboard: { id: 'd1', dashboardId: 'd1', businessId: null, householdId: null },
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'widget.add',
        targetId: 'w1',
        metadata: { widgetType: 'chat', dashboardId: 'd1' },
      })
    );
  });

  it('recordWidgetLayoutBatchUpdate emits batch action', async () => {
    await recordWidgetLayoutBatchUpdate({
      actorUserId: 'u1',
      dashboard: { id: 'd1', dashboardId: 'd1' },
      widgetCount: 3,
      positionCount: 2,
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'widget.layout.batch_update',
        metadata: { widgetCount: 3, positionCount: 2 },
      })
    );
  });
});
