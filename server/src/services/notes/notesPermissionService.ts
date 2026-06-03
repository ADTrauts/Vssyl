import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { assertUserOwnedDashboardBusinessAlignment } from '../taskDashboardBinding';
import { NotesServiceError } from './notesErrors';

/** Active page (not trashed). */
export function buildPageNotTrashedWhere(): Prisma.NoteWhereInput {
  return { trashedAt: null };
}

export function buildPageOwnerOrSharedReadWhere(userId: string, pageId?: string): Prisma.NoteWhereInput {
  const where: Prisma.NoteWhereInput = {
    trashedAt: null,
    OR: [
      { createdById: userId },
      { shares: { some: { sharedWithUserId: userId } } },
    ],
  };
  if (pageId) {
    where.id = pageId;
  }
  return where;
}

export function buildPageOwnerWriteWhere(userId: string, pageId?: string): Prisma.NoteWhereInput {
  const where: Prisma.NoteWhereInput = {
    trashedAt: null,
    OR: [
      { createdById: userId },
      { shares: { some: { sharedWithUserId: userId, role: 'editor' } } },
    ],
  };
  if (pageId) {
    where.id = pageId;
  }
  return where;
}

export function userOwnsPage(page: { createdById: string }, userId: string): boolean {
  return page.createdById === userId;
}

export function userCanReadPageLegacy(
  page: { createdById: string; trashedAt?: Date | null },
  userId: string,
  shareRole?: string | null
): boolean {
  if (page.trashedAt) return false;
  if (page.createdById === userId) return true;
  return shareRole === 'viewer' || shareRole === 'editor';
}

export function userCanWritePageLegacy(
  page: { createdById: string; trashedAt?: Date | null },
  userId: string,
  shareRole?: string | null
): boolean {
  if (page.trashedAt) return false;
  if (page.createdById === userId) return true;
  return shareRole === 'editor';
}

export async function assertDashboardContextForPageCreate(
  userId: string,
  dashboardId: string,
  businessId: string | null | undefined
): Promise<void> {
  try {
    await assertUserOwnedDashboardBusinessAlignment(prisma, userId, dashboardId, businessId ?? null);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Task dashboard not found') {
      throw new NotesServiceError('Dashboard not found', 'not_found', 404);
    }
    if (msg === 'Task dashboard context mismatch') {
      throw new NotesServiceError('Dashboard does not match business context', 'invalid', 400);
    }
    throw error;
  }
}

export async function assertFolderOnDashboard(params: {
  userId: string;
  folderId: string;
  dashboardId: string;
  businessId: string | null;
}): Promise<void> {
  const folder = await prisma.noteFolder.findFirst({
    where: {
      id: params.folderId,
      createdById: params.userId,
      dashboardId: params.dashboardId,
      businessId: params.businessId,
    },
  });
  if (!folder) {
    throw new NotesServiceError('Folder not found or not in this dashboard', 'invalid', 400);
  }
}

export async function findReadablePage(pageId: string, userId: string) {
  return prisma.note.findFirst({
    where: buildPageOwnerOrSharedReadWhere(userId, pageId),
  });
}

export async function assertCanReadPage(pageId: string, userId: string) {
  const page = await findReadablePage(pageId, userId);
  if (!page) {
    throw new NotesServiceError('Page not found', 'not_found', 404);
  }
  return page;
}

export async function assertCanWritePage(pageId: string, userId: string) {
  const page = await prisma.note.findFirst({
    where: buildPageOwnerWriteWhere(userId, pageId),
  });
  if (!page) {
    throw new NotesServiceError('Page not found', 'not_found', 404);
  }
  return page;
}

export async function assertCanTrashPage(pageId: string, userId: string) {
  const page = await prisma.note.findFirst({
    where: {
      id: pageId,
      createdById: userId,
      trashedAt: null,
    },
  });
  if (!page) {
    throw new NotesServiceError('Page not found', 'not_found', 404);
  }
  return page;
}

export async function assertCanSharePage(pageId: string, userId: string) {
  const page = await prisma.note.findFirst({
    where: {
      id: pageId,
      createdById: userId,
      trashedAt: null,
    },
    select: { id: true, title: true, dashboardId: true, businessId: true },
  });
  if (!page) {
    throw new NotesServiceError('Page not found', 'not_found', 404);
  }
  return page;
}
