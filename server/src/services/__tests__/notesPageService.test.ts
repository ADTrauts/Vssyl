import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as notesPolicyDual from '../notes/notesPolicyDual';
import * as notesActivity from '../notes/notesActivityService';
import * as notesDomain from '../notes/notesDomainEventService';
import * as notesPermission from '../notes/notesPermissionService';
import { createPage } from '../notes/notesPageService';
import { NotesServiceError } from '../notes/notesErrors';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('notesPageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notesPermission, 'assertDashboardContextForPageCreate').mockResolvedValue(undefined);
    vi.spyOn(notesPolicyDual, 'evaluateNotesPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(notesActivity, 'recordPageCreated').mockResolvedValue(undefined);
    vi.spyOn(notesDomain, 'recordPageCreatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(prisma.note, 'create').mockResolvedValue({
      id: 'page-1',
      title: 'Meeting',
      dashboardId: 'dash-1',
      businessId: null,
      folderId: null,
      tags: [],
      pinned: false,
      createdById: 'u1',
    } as never);
  });

  it('creates a page after policy passes', async () => {
    const note = await createPage({
      userId: 'u1',
      title: 'Meeting',
      dashboardId: 'dash-1',
    });
    expect(note.id).toBe('page-1');
    expect(notesActivity.recordPageCreated).toHaveBeenCalled();
    expect(notesDomain.recordPageCreatedDomainEvent).toHaveBeenCalled();
  });

  it('rejects empty title', async () => {
    await expect(
      createPage({ userId: 'u1', title: '  ', dashboardId: 'dash-1' })
    ).rejects.toBeInstanceOf(NotesServiceError);
  });
});
