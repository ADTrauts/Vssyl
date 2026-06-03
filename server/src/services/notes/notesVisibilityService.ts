import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { ListPagesQuery, NotePageDetail, NotePageListItem } from './notesTypes';
import { buildPageNotTrashedWhere, buildPageOwnerOrSharedReadWhere } from './notesPermissionService';

const PAGE_LIST_SELECT = {
  id: true,
  title: true,
  content: true,
  tags: true,
  pinned: true,
  dashboardId: true,
  businessId: true,
  folderId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NoteSelect;

function normalizeBusinessId(businessId?: string | null): string | null {
  return businessId && businessId !== '' ? businessId : null;
}

function buildListWhere(query: ListPagesQuery): Prisma.NoteWhereInput {
  const businessId = normalizeBusinessId(query.businessId);
  const where: Prisma.NoteWhereInput = {
    dashboardId: query.dashboardId,
    ...buildPageNotTrashedWhere(),
  };

  if (query.sharedWithMe) {
    where.shares = { some: { sharedWithUserId: query.userId } };
  } else {
    where.createdById = query.userId;
  }

  where.businessId = businessId;

  if (query.folderId !== undefined && query.folderId !== null) {
    if (query.folderId === '' || query.folderId === 'none') {
      where.folderId = null;
    } else {
      where.folderId = query.folderId;
    }
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (query.tag) {
    where.tags = { has: query.tag };
  }

  if (query.pinned !== undefined) {
    where.pinned = query.pinned;
  }

  return where;
}

function toListItem(
  row: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    pinned: boolean;
    dashboardId: string;
    businessId: string | null;
    folderId: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  },
  userId: string
): NotePageListItem {
  const { createdById, ...rest } = row;
  return { ...rest, isOwner: createdById === userId };
}

export async function listPages(query: ListPagesQuery): Promise<NotePageListItem[]> {
  const notes = await prisma.note.findMany({
    where: buildListWhere(query),
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    select: PAGE_LIST_SELECT,
  });
  return notes.map((n) => toListItem(n, query.userId));
}

export async function getPageById(pageId: string, userId: string): Promise<NotePageDetail | null> {
  const note = await prisma.note.findFirst({
    where: buildPageOwnerOrSharedReadWhere(userId, pageId),
    select: {
      ...PAGE_LIST_SELECT,
      shares: {
        where: { sharedWithUserId: userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!note) {
    return null;
  }

  const shareWithMe = note.shares?.[0];
  const canEdit = note.createdById === userId || shareWithMe?.role === 'editor';
  const isOwner = note.createdById === userId;
  const { shares: _s, ...rest } = note;
  return { ...toListItem(rest, userId), canEdit, isOwner };
}

export async function listRecentPagesForAi(params: {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  take?: number;
}) {
  const businessId = normalizeBusinessId(params.businessId);
  return prisma.note.findMany({
    where: {
      createdById: params.userId,
      dashboardId: params.dashboardId,
      businessId,
      ...buildPageNotTrashedWhere(),
    },
    orderBy: { updatedAt: 'desc' },
    take: params.take ?? 15,
    select: {
      id: true,
      title: true,
      tags: true,
      pinned: true,
      updatedAt: true,
    },
  });
}

export async function listPinnedPagesForAi(params: {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  take?: number;
}) {
  const businessId = normalizeBusinessId(params.businessId);
  return prisma.note.findMany({
    where: {
      createdById: params.userId,
      dashboardId: params.dashboardId,
      businessId,
      pinned: true,
      ...buildPageNotTrashedWhere(),
    },
    orderBy: { updatedAt: 'desc' },
    take: params.take ?? 20,
    select: {
      id: true,
      title: true,
      tags: true,
      pinned: true,
      updatedAt: true,
    },
  });
}

export function toPageSnapshot(page: {
  id: string;
  title: string;
  dashboardId: string;
  businessId: string | null;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  createdById: string;
}) {
  return {
    id: page.id,
    title: page.title,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
    folderId: page.folderId,
    tags: page.tags,
    pinned: page.pinned,
    createdById: page.createdById,
  };
}
