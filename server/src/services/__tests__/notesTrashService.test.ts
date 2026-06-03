import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as notesPolicyDual from '../notes/notesPolicyDual';
import * as notesActivity from '../notes/notesActivityService';
import * as notesDomain from '../notes/notesDomainEventService';
import * as notesPermission from '../notes/notesPermissionService';
import { NotesServiceError, NotesTrashError } from '../notes/notesErrors';
import { restorePage, softTrashPage } from '../notes/notesTrashService';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const basePage = {
  id: 'page-1',
  title: 'Draft',
  dashboardId: 'dash-1',
  businessId: null,
  folderId: null,
  tags: [],
  pinned: false,
  createdById: 'u1',
  trashedAt: null,
};

describe('notesTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notesPolicyDual, 'evaluateNotesPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(notesActivity, 'recordPageTrashed').mockResolvedValue(undefined);
    vi.spyOn(notesActivity, 'recordPageRestored').mockResolvedValue(undefined);
    vi.spyOn(notesDomain, 'recordPageTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(notesDomain, 'recordPageRestoredDomainEvent').mockImplementation(() => undefined);
  });

  it('soft-trashes an owned page', async () => {
    vi.spyOn(notesPermission, 'assertCanTrashPage').mockResolvedValue(basePage as never);
    vi.spyOn(prisma.note, 'updateMany').mockResolvedValue({ count: 1 });

    const result = await softTrashPage('u1', 'page-1');
    expect(result).toEqual({ success: true });
    expect(notesActivity.recordPageTrashed).toHaveBeenCalled();
  });

  it('maps not_found from permission layer', async () => {
    vi.spyOn(notesPermission, 'assertCanTrashPage').mockRejectedValue(
      new NotesServiceError('Page not found', 'not_found', 404)
    );

    await expect(softTrashPage('u1', 'missing')).rejects.toBeInstanceOf(NotesTrashError);
  });

  it('restores a trashed page', async () => {
    vi.spyOn(prisma.note, 'findFirst').mockResolvedValue({ ...basePage, trashedAt: new Date() } as never);
    vi.spyOn(prisma.note, 'updateMany').mockResolvedValue({ count: 1 });

    const ok = await restorePage({ userId: 'u1', pageId: 'page-1' });
    expect(ok).toBe(true);
    expect(notesActivity.recordPageRestored).toHaveBeenCalled();
  });
});
