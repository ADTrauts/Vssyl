import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { NotesServiceError, NotesTrashError } from './notesErrors';

export { NotesTrashError };
import { assertCanTrashPage } from './notesPermissionService';
import { evaluateNotesPolicyDual } from './notesPolicyDual';
import { toPageSnapshot } from './notesVisibilityService';
import * as notesActivity from './notesActivityService';
import * as notesDomain from './notesDomainEventService';

export type NotesTrashItemType = 'note';

export interface NotesTrashMutationInput {
  userId: string;
  type: NotesTrashItemType;
  id: string;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: 'note';
  moduleId: 'notes';
  moduleName: 'Notebook Pages';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

function mapNotesServiceError(error: unknown): never {
  if (error instanceof NotesServiceError) {
    if (error.code === 'forbidden') {
      throw new NotesTrashError('Forbidden', 'forbidden');
    }
    if (error.code === 'not_found') {
      throw new NotesTrashError('Not found', 'not_found');
    }
  }
  throw error;
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
    throw new NotesTrashError('Forbidden', 'forbidden');
  }
}

async function findTrashedPageForMutation(pageId: string, userId: string) {
  return prisma.note.findFirst({
    where: {
      id: pageId,
      createdById: userId,
      trashedAt: { not: null },
    },
  });
}

export async function softTrashPage(userId: string, pageId: string) {
  let page;
  try {
    page = await assertCanTrashPage(pageId, userId);
  } catch (error: unknown) {
    mapNotesServiceError(error);
  }

  await assertNotesPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.NOTES_PAGE_DELETE,
    resourceId: pageId,
    scope: {
      dashboardId: page.dashboardId,
      businessId: page.businessId ?? undefined,
    },
  });

  const updated = await prisma.note.updateMany({
    where: { id: pageId, trashedAt: null },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new NotesTrashError('Page not found or already trashed', 'not_found');
  }

  await logger.info('Page trashed', {
    operation: 'notes_trash_page',
    pageId,
    userId,
  });

  const snapshot = toPageSnapshot(page);
  await notesActivity.recordPageTrashed({ actorUserId: userId, page: snapshot });
  notesDomain.recordPageTrashedDomainEvent({ actorUserId: userId, page: snapshot });

  return { success: true as const };
}

export async function restorePage(params: { userId: string; pageId: string }): Promise<boolean> {
  const page = await findTrashedPageForMutation(params.pageId, params.userId);
  if (!page) {
    return false;
  }

  await assertNotesPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.NOTES_PAGE_RESTORE,
    resourceId: params.pageId,
    scope: {
      dashboardId: page.dashboardId,
      businessId: page.businessId ?? undefined,
    },
  });

  const updated = await prisma.note.updateMany({
    where: { id: params.pageId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  const snapshot = toPageSnapshot(page);
  await notesActivity.recordPageRestored({ actorUserId: params.userId, page: snapshot });
  notesDomain.recordPageRestoredDomainEvent({ actorUserId: params.userId, page: snapshot });

  return true;
}

export async function permanentlyDeletePage(params: {
  userId: string;
  pageId: string;
}): Promise<boolean> {
  const page = await findTrashedPageForMutation(params.pageId, params.userId);
  if (!page) {
    return false;
  }

  await assertNotesPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.NOTES_PAGE_PERMANENT_DELETE,
    resourceId: params.pageId,
    scope: {
      dashboardId: page.dashboardId,
      businessId: page.businessId ?? undefined,
    },
  });

  const deleted = await prisma.note.deleteMany({
    where: { id: params.pageId, trashedAt: { not: null } },
  });

  if (deleted.count === 0) {
    return false;
  }

  const snapshot = toPageSnapshot(page);
  await notesActivity.recordPagePermanentlyDeleted({ actorUserId: params.userId, page: snapshot });
  notesDomain.recordPagePermanentlyDeletedDomainEvent({ actorUserId: params.userId, page: snapshot });

  return true;
}

export async function softTrashNotesItem(input: NotesTrashMutationInput): Promise<void> {
  if (input.type !== 'note') {
    throw new NotesTrashError(`Unsupported notes trash type: ${input.type}`, 'invalid');
  }
  await softTrashPage(input.userId, input.id);
}

export async function restoreNotesItem(input: NotesTrashMutationInput): Promise<boolean> {
  if (input.type !== 'note') {
    return false;
  }
  return restorePage({ userId: input.userId, pageId: input.id });
}

export async function permanentlyDeleteNotesItem(input: NotesTrashMutationInput): Promise<boolean> {
  if (input.type !== 'note') {
    return false;
  }
  return permanentlyDeletePage({ userId: input.userId, pageId: input.id });
}

export async function listTrashedPagesForGlobalTrash(userId: string): Promise<GlobalTrashListItem[]> {
  const pages = await prisma.note.findMany({
    where: {
      createdById: userId,
      trashedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      dashboardId: true,
      businessId: true,
    },
    orderBy: { trashedAt: 'desc' },
  });

  return pages.map((page) => ({
    id: page.id,
    name: page.title,
    type: 'note' as const,
    moduleId: 'notes' as const,
    moduleName: 'Notebook Pages' as const,
    trashedAt: page.trashedAt,
    metadata: {
      pageId: page.id,
      dashboardId: page.dashboardId,
      businessId: page.businessId,
    },
  }));
}

export async function emptyNotesTrash(input: { userId: string }): Promise<number> {
  const trashed = await prisma.note.findMany({
    where: {
      createdById: input.userId,
      trashedAt: { not: null },
    },
    select: { id: true },
  });

  let deletedCount = 0;
  for (const page of trashed) {
    const deleted = await permanentlyDeletePage({ userId: input.userId, pageId: page.id });
    if (deleted) {
      deletedCount += 1;
    }
  }
  return deletedCount;
}
