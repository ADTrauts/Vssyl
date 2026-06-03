import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { NotesServiceError } from './notesErrors';
import { assertCanSharePage } from './notesPermissionService';
import { evaluateNotesPolicyDual } from './notesPolicyDual';
import { toPageSnapshot } from './notesVisibilityService';
import * as notesActivity from './notesActivityService';
import * as notesDomain from './notesDomainEventService';
import * as notesNotify from './notesNotificationService';

export async function sharePage(params: {
  ownerUserId: string;
  pageId: string;
  sharedWithUserId: string;
  role: 'viewer' | 'editor';
}) {
  if (params.sharedWithUserId === params.ownerUserId) {
    throw new NotesServiceError('Cannot share with yourself', 'invalid', 400);
  }

  const page = await assertCanSharePage(params.pageId, params.ownerUserId);

  const policyBlock = await evaluateNotesPolicyDual({
    userId: params.ownerUserId,
    action: POLICY_ACTIONS.NOTES_PAGE_SHARE,
    resourceId: params.pageId,
    scope: {
      dashboardId: page.dashboardId,
      businessId: page.businessId ?? undefined,
    },
  });
  if (policyBlock.blocked) {
    throw new NotesServiceError('Not authorized to share page', 'forbidden', 403);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NoteShare types may lag generate
  const share = await (prisma as any).noteShare.upsert({
    where: {
      noteId_sharedWithUserId: {
        noteId: params.pageId,
        sharedWithUserId: params.sharedWithUserId,
      },
    },
    create: {
      noteId: params.pageId,
      sharedWithUserId: params.sharedWithUserId,
      sharedById: params.ownerUserId,
      role: params.role,
    },
    update: { role: params.role },
    select: {
      id: true,
      noteId: true,
      sharedWithUserId: true,
      role: true,
      createdAt: true,
    },
  });

  const snapshot = toPageSnapshot({
    id: page.id,
    title: page.title,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
    folderId: null,
    tags: [],
    pinned: false,
    createdById: params.ownerUserId,
  });

  await notesActivity.recordPageShared({
    actorUserId: params.ownerUserId,
    page: snapshot,
    sharedWithUserId: params.sharedWithUserId,
    role: params.role,
  });
  notesDomain.recordPageSharedDomainEvent({
    actorUserId: params.ownerUserId,
    page: snapshot,
    sharedWithUserId: params.sharedWithUserId,
    role: params.role,
  });

  await notesNotify.notifyPageShared({
    pageId: params.pageId,
    pageTitle: page.title,
    sharedById: params.ownerUserId,
    sharedWithUserId: params.sharedWithUserId,
    role: params.role,
  });

  return share;
}

export async function revokePageShare(params: {
  ownerUserId: string;
  pageId: string;
  targetUserId: string;
}): Promise<void> {
  const page = await assertCanSharePage(params.pageId, params.ownerUserId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).noteShare.deleteMany({
    where: {
      noteId: params.pageId,
      sharedWithUserId: params.targetUserId,
    },
  });

  const snapshot = toPageSnapshot({
    id: page.id,
    title: page.title,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
    folderId: null,
    tags: [],
    pinned: false,
    createdById: params.ownerUserId,
  });

  await notesActivity.recordPageUnshared({
    actorUserId: params.ownerUserId,
    page: snapshot,
    sharedWithUserId: params.targetUserId,
  });
  notesDomain.recordPageUnsharedDomainEvent({
    actorUserId: params.ownerUserId,
    page: snapshot,
    sharedWithUserId: params.targetUserId,
  });
}

export async function listPageShares(params: { ownerUserId: string; pageId: string }) {
  await assertCanSharePage(params.pageId, params.ownerUserId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).noteShare.findMany({
    where: { noteId: params.pageId },
    select: {
      id: true,
      sharedWithUserId: true,
      role: true,
      createdAt: true,
      sharedWith: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
