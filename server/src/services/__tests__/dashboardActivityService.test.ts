import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import {
  recordDashboardCreated,
  recordQuickNoteCreated,
  recordBookmarkCreated,
  recordWidgetAdded,
  recordWidgetLayoutBatchUpdate,
} from '../dashboardActivityService';

describe('dashboardActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
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

  it('recordQuickNoteCreated emits widget.quicknote.create', async () => {
    await recordQuickNoteCreated({
      actorUserId: 'u1',
      widget: { id: 'w1', dashboardId: 'd1' },
      dashboard: { id: 'd1', dashboardId: 'd1', businessId: null, householdId: null },
      noteId: 'n1',
      titlePreview: 'Hello',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'widget.quicknote.create',
        targetType: 'quick_note',
        targetId: 'n1',
      })
    );
  });

  it('recordBookmarkCreated emits widget.bookmark.create', async () => {
    await recordBookmarkCreated({
      actorUserId: 'u1',
      widget: { id: 'w2', dashboardId: 'd1' },
      dashboard: { id: 'd1', dashboardId: 'd1', businessId: null, householdId: null },
      bookmarkId: 'b1',
      title: 'Docs',
      url: 'https://example.com',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'widget.bookmark.create',
        targetType: 'bookmark',
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
