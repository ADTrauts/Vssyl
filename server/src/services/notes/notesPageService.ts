import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { NotesServiceError } from './notesErrors';
import {
  assertCanWritePage,
  assertDashboardContextForPageCreate,
  assertFolderOnDashboard,
} from './notesPermissionService';
import { evaluateNotesPolicyDual } from './notesPolicyDual';
import * as notesActivity from './notesActivityService';
import * as notesDomain from './notesDomainEventService';
import { toPageSnapshot } from './notesVisibilityService';
import type { NotePageSnapshot } from './notesTypes';

export interface CreatePageInput {
  userId: string;
  title: string;
  content?: string;
  dashboardId: string;
  businessId?: string | null;
  tags?: string[];
  pinned?: boolean;
  folderId?: string | null;
}

export interface UpdatePageInput {
  userId: string;
  pageId: string;
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  folderId?: string | null;
}

async function assertNotesPolicyNotBlocked(params: {
  userId: string;
  action: Parameters<typeof evaluateNotesPolicyDual>[0]['action'];
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string };
}): Promise<void> {
  const policyBlock = await evaluateNotesPolicyDual({
    userId: params.userId,
    action: params.action,
    resourceId: params.resourceId,
    scope: params.scope,
  });
  if (policyBlock.blocked) {
    throw new NotesServiceError('Not authorized', 'forbidden', 403);
  }
}

export async function createPage(input: CreatePageInput) {
  const title = input.title.trim();
  if (!title) {
    throw new NotesServiceError('Title is required', 'invalid', 400);
  }

  const normalizedBusinessId =
    input.businessId && typeof input.businessId === 'string' ? input.businessId : null;

  await assertDashboardContextForPageCreate(input.userId, input.dashboardId, normalizedBusinessId);

  if (input.folderId && typeof input.folderId === 'string') {
    await assertFolderOnDashboard({
      userId: input.userId,
      folderId: input.folderId,
      dashboardId: input.dashboardId,
      businessId: normalizedBusinessId,
    });
  }

  await assertNotesPolicyNotBlocked({
    userId: input.userId,
    action: POLICY_ACTIONS.NOTES_PAGE_CREATE,
    resourceId: 'new',
    scope: { dashboardId: input.dashboardId, businessId: normalizedBusinessId ?? undefined },
  });

  const note = await prisma.note.create({
    data: {
      title,
      content: typeof input.content === 'string' ? input.content : '',
      dashboardId: input.dashboardId,
      businessId: normalizedBusinessId,
      folderId: input.folderId && typeof input.folderId === 'string' ? input.folderId : null,
      tags: Array.isArray(input.tags) ? input.tags.filter((t) => typeof t === 'string') : [],
      pinned: Boolean(input.pinned),
      createdBy: { connect: { id: input.userId } },
      updatedBy: { connect: { id: input.userId } },
    } as unknown as Prisma.NoteCreateInput,
  });

  const snapshot = toPageSnapshot(note);
  await notesActivity.recordPageCreated({ actorUserId: input.userId, page: snapshot });
  notesDomain.recordPageCreatedDomainEvent({ actorUserId: input.userId, page: snapshot });

  return note;
}

export async function updatePage(input: UpdatePageInput) {
  const existing = await assertCanWritePage(input.pageId, input.userId);

  await assertNotesPolicyNotBlocked({
    userId: input.userId,
    action: POLICY_ACTIONS.NOTES_PAGE_UPDATE,
    resourceId: input.pageId,
    scope: {
      dashboardId: existing.dashboardId,
      businessId: existing.businessId ?? undefined,
    },
  });

  const data: Prisma.NoteUpdateInput = {
    updatedBy: { connect: { id: input.userId } },
  };

  if (input.title !== undefined && typeof input.title === 'string') {
    data.title = input.title.trim();
  }
  if (input.content !== undefined) {
    data.content = typeof input.content === 'string' ? input.content : '';
  }
  if (Array.isArray(input.tags)) {
    data.tags = input.tags.filter((t) => typeof t === 'string');
  }
  if (input.pinned !== undefined) {
    data.pinned = Boolean(input.pinned);
  }
  if (input.folderId !== undefined) {
    data.folder =
      input.folderId && typeof input.folderId === 'string'
        ? { connect: { id: input.folderId } }
        : { disconnect: true };
  }

  const note = await prisma.note.update({
    where: { id: input.pageId },
    data,
  });

  const snapshot = toPageSnapshot(note);
  await notesActivity.recordPageUpdated({ actorUserId: input.userId, page: snapshot });
  notesDomain.recordPageUpdatedDomainEvent({ actorUserId: input.userId, page: snapshot });

  return note;
}

export function snapshotFromNote(note: {
  id: string;
  title: string;
  dashboardId: string;
  businessId: string | null;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  createdById: string;
}): NotePageSnapshot {
  return toPageSnapshot(note);
}
