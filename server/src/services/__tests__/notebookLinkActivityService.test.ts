import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import { recordLinkArchived, recordLinkCreated } from '../notebook/notebookLinkActivityService';

describe('notebookLinkActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
  });

  it('recordLinkCreated emits linked_task_to_page for TASK', async () => {
    await recordLinkCreated({
      actorUserId: 'u1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'ACTION_SOURCE',
      dashboardId: 'dash-1',
      businessId: null,
      linkId: 'link-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'notebook',
        action: 'linked_task_to_page',
        targetId: 'page-1',
      })
    );
  });

  it('recordLinkArchived emits unlinked_from_page', async () => {
    await recordLinkArchived({
      actorUserId: 'u1',
      pageId: 'page-1',
      targetType: 'FILE',
      targetId: 'file-1',
      dashboardId: 'dash-1',
      businessId: null,
      linkId: 'link-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'unlinked_from_page',
      })
    );
  });
});
