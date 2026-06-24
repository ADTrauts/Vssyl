import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { ListPagesQuery, NotePageDetail, NotePageListItem } from './notesTypes';
import { buildPageNotTrashedWhere, buildPageOwnerOrSharedReadWhere } from './notesPermissionService';
import { evaluateNotesPolicyDual } from './notesPolicyDual';
import { POLICY_ACTIONS } from '../../auth/policyActions';

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

/**
 * Federated global search: owned + shared pages with tenant scope and PE read gate.
 */
export async function searchAccessiblePages(params: {
  userId: string;
  query: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  limit?: number;
}): Promise<NotePageListItem[]> {
  const term = params.query.trim();
  if (term.length < 2) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const normalizedBusinessId = normalizeBusinessId(params.businessId);

  const where: Prisma.NoteWhereInput = {
    ...buildPageOwnerOrSharedReadWhere(params.userId),
    AND: [
      {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } },
        ],
      },
    ],
  };

  if (params.dashboardId) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: params.dashboardId, userId: params.userId },
      select: { businessId: true, householdId: true },
    });

    if (!dashboard) {
      return [];
    }

    if (
      normalizedBusinessId !== undefined &&
      (dashboard.businessId ?? null) !== normalizedBusinessId
    ) {
      return [];
    }

    if (params.householdId && dashboard.householdId !== params.householdId) {
      return [];
    }

    where.dashboardId = params.dashboardId;
    where.businessId = dashboard.businessId ?? null;
  } else if (normalizedBusinessId !== undefined) {
    where.businessId = normalizedBusinessId;
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
    select: PAGE_LIST_SELECT,
  });

  const filtered: NotePageListItem[] = [];
  for (const note of notes) {
    const policy = await evaluateNotesPolicyDual({
      userId: params.userId,
      action: POLICY_ACTIONS.NOTES_PAGE_READ,
      resourceId: note.id,
      scope: {
        dashboardId: note.dashboardId,
        businessId: note.businessId ?? undefined,
      },
    });
    if (!policy.blocked) {
      filtered.push(toListItem(note, params.userId));
    }
  }

  return filtered;
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
