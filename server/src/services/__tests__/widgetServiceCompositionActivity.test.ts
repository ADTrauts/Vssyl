import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as dashboardActivity from '../dashboardActivityService';
import { updateWidget } from '../widgetService';

describe('widgetService composition widget activity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dashboardActivity, 'recordWidgetUpdated').mockResolvedValue(undefined);
    vi.spyOn(dashboardActivity, 'recordQuickNoteCreated').mockResolvedValue(undefined);
    vi.spyOn(dashboardActivity, 'recordBookmarkCreated').mockResolvedValue(undefined);
  });

  it('emits quicknote.create when a new note appears in config', async () => {
    vi.spyOn(prisma.widget, 'findFirst').mockResolvedValue({
      id: 'w1',
      type: 'quicknotes',
      dashboardId: 'd1',
      config: { notes: [] },
      dashboard: { id: 'd1', businessId: null, householdId: null, institutionId: null },
    } as never);
    vi.spyOn(prisma.widget, 'update').mockResolvedValue({
      id: 'w1',
      type: 'quicknotes',
      dashboardId: 'd1',
    } as never);

    await updateWidget('u1', 'w1', {
      config: {
        notes: [{ id: 'n-new', content: 'New scratchpad entry', pinned: false }],
      },
    });

    expect(dashboardActivity.recordQuickNoteCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'n-new',
        widget: { id: 'w1', dashboardId: 'd1' },
      })
    );
  });

  it('emits bookmark.create when a new bookmark appears in config', async () => {
    vi.spyOn(prisma.widget, 'findFirst').mockResolvedValue({
      id: 'w2',
      type: 'bookmarks',
      dashboardId: 'd1',
      config: { bookmarks: [] },
      dashboard: { id: 'd1', businessId: null, householdId: null, institutionId: null },
    } as never);
    vi.spyOn(prisma.widget, 'update').mockResolvedValue({
      id: 'w2',
      type: 'bookmarks',
      dashboardId: 'd1',
    } as never);

    await updateWidget('u1', 'w2', {
      config: {
        bookmarks: [{ id: 'b-new', title: 'API Docs', url: 'https://example.com/api' }],
      },
    });

    expect(dashboardActivity.recordBookmarkCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        bookmarkId: 'b-new',
        title: 'API Docs',
      })
    );
  });
});
