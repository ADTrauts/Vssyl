import { Prisma } from '@prisma/client';
import {
  NotebookLinkDirection,
  NotebookLinkEntityType,
  NotebookLinkRelationshipType,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as linkActivity from './notebookLinkActivityService';
import * as linkDomain from './notebookLinkDomainEventService';
import { NotebookLinkServiceError } from './notebookLinkErrors';
import {
  assertCanArchiveLink,
  assertCanCreatePageLink,
  assertCanReadPageLinks,
  validateLinkMetadata,
} from './notebookLinkPermissionService';
import { toListItemsWithTargets } from './notebookLinkVisibilityService';
import { findReadablePage } from '../notes/notesPermissionService';
import {
  assertCanReadEntityBacklinks,
} from './notebookLinkPermissionService';
import type {
  CreatePageLinkInput,
  EntityNotebookLinkListItem,
  ListEntityLinksInput,
  ListEntityLinksResult,
  ListPageLinksInput,
  ListPageLinksResult,
  NotebookLinkListItem,
} from './notebookLinkTypes';

function parseEntityType(value: string): NotebookLinkEntityType | null {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === 'PAGE' ||
    normalized === 'TASK' ||
    normalized === 'FILE' ||
    normalized === 'CALENDAR_EVENT' ||
    normalized === 'CHAT_CONVERSATION' ||
    normalized === 'PLACE_LISTING'
  ) {
    return normalized as NotebookLinkEntityType;
  }
  return null;
}

function parseRelationshipType(value: string | undefined): NotebookLinkRelationshipType {
  if (!value) return 'REFERENCE';
  const normalized = value.trim().toUpperCase();
  const allowed: NotebookLinkRelationshipType[] = [
    'REFERENCE',
    'ACTION_SOURCE',
    'AGENDA',
    'EVIDENCE',
    'EMBED',
  ];
  if (allowed.includes(normalized as NotebookLinkRelationshipType)) {
    return normalized as NotebookLinkRelationshipType;
  }
  throw new NotebookLinkServiceError('Invalid relationshipType', 'invalid', 400);
}

export { parseEntityType, parseRelationshipType };

export async function listPageLinks(input: ListPageLinksInput): Promise<ListPageLinksResult> {
  const page = await assertCanReadPageLinks(input.userId, input.pageId);

  const where: Prisma.NotebookLinkWhereInput = {
    dashboardId: page.dashboardId,
    sourceType: 'PAGE',
    sourceId: input.pageId,
    archivedAt: input.includeArchived ? undefined : null,
  };

  if (input.targetType) {
    where.targetType = input.targetType;
  }
  if (input.relationshipType) {
    where.relationshipType = input.relationshipType;
  }

  const rows = await prisma.notebookLink.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const links = await toListItemsWithTargets(input.userId, rows);

  return { pageId: input.pageId, links };
}

async function rowToListItem(
  userId: string,
  row: Awaited<ReturnType<typeof prisma.notebookLink.create>>
): Promise<NotebookLinkListItem> {
  const items = await toListItemsWithTargets(userId, [row]);
  const item = items[0];
  if (!item?.targetAccessible) {
    throw new NotebookLinkServiceError('Linked target is not accessible', 'forbidden', 403);
  }
  return item;
}

export async function createPageLink(input: CreatePageLinkInput): Promise<{
  link: NotebookLinkListItem;
  created: boolean;
}> {
  const relationshipType = parseRelationshipType(input.relationshipType);
  const metadata = validateLinkMetadata(input.metadata);

  const page = await assertCanCreatePageLink({
    userId: input.userId,
    pageId: input.pageId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  const uniqueKey = {
    dashboardId: page.dashboardId,
    sourceType: 'PAGE' as const,
    sourceId: input.pageId,
    targetType: input.targetType,
    targetId: input.targetId,
    relationshipType,
  };

  const existingActive = await prisma.notebookLink.findFirst({
    where: { ...uniqueKey, archivedAt: null },
  });

  if (existingActive) {
    const link = await rowToListItem(input.userId, existingActive);
    return { link, created: false };
  }

  const existingArchived = await prisma.notebookLink.findUnique({
    where: {
      dashboardId_sourceType_sourceId_targetType_targetId_relationshipType: uniqueKey,
    },
  });

  if (existingArchived?.archivedAt) {
    const row = await prisma.notebookLink.update({
      where: { id: existingArchived.id },
      data: {
        archivedAt: null,
        createdById: input.userId,
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });

    await linkActivity.recordLinkCreated({
      actorUserId: input.userId,
      pageId: input.pageId,
      targetType: input.targetType,
      targetId: input.targetId,
      relationshipType,
      dashboardId: page.dashboardId,
      businessId: page.businessId,
      linkId: row.id,
    });

    linkDomain.recordLinkCreatedDomainEvent({
      actorUserId: input.userId,
      linkId: row.id,
      pageId: input.pageId,
      targetType: input.targetType,
      targetId: input.targetId,
      relationshipType,
      dashboardId: page.dashboardId,
      businessId: page.businessId,
    });

    const link = await rowToListItem(input.userId, row);
    return { link, created: true };
  }

  const row = await prisma.notebookLink.create({
    data: {
      dashboardId: page.dashboardId,
      businessId: page.businessId,
      sourceType: 'PAGE',
      sourceId: input.pageId,
      targetType: input.targetType,
      targetId: input.targetId,
      relationshipType,
      direction: NotebookLinkDirection.OUTBOUND,
      createdById: input.userId,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await linkActivity.recordLinkCreated({
    actorUserId: input.userId,
    pageId: input.pageId,
    targetType: input.targetType,
    targetId: input.targetId,
    relationshipType,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
    linkId: row.id,
  });

  linkDomain.recordLinkCreatedDomainEvent({
    actorUserId: input.userId,
    linkId: row.id,
    pageId: input.pageId,
    targetType: input.targetType,
    targetId: input.targetId,
    relationshipType,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
  });

  const link = await rowToListItem(input.userId, row);
  return { link, created: true };
}

export async function listEntityLinks(input: ListEntityLinksInput): Promise<ListEntityLinksResult> {
  const entityType = input.entityType;
  await assertCanReadEntityBacklinks({
    userId: input.userId,
    entityType,
    entityId: input.entityId,
  });

  const rows = await prisma.notebookLink.findMany({
    where: {
      targetType: entityType,
      targetId: input.entityId,
      sourceType: 'PAGE',
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  const links: EntityNotebookLinkListItem[] = [];
  for (const row of rows) {
    const page = await findReadablePage(row.sourceId, input.userId);
    if (!page) {
      continue;
    }
    links.push({
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      targetType: row.targetType,
      targetId: row.targetId,
      relationshipType: row.relationshipType,
      direction: row.direction,
      createdAt: row.createdAt.toISOString(),
      page: { id: page.id, title: page.title },
    });
  }

  return {
    entityType,
    entityId: input.entityId,
    links,
  };
}

export async function archiveNotebookLink(params: {
  userId: string;
  linkId: string;
}): Promise<void> {
  const { link, pageId } = await assertCanArchiveLink({
    userId: params.userId,
    linkId: params.linkId,
  });

  if (link.archivedAt) {
    return;
  }

  await prisma.notebookLink.update({
    where: { id: link.id },
    data: { archivedAt: new Date() },
  });

  await linkActivity.recordLinkArchived({
    actorUserId: params.userId,
    pageId,
    targetType: link.targetType,
    targetId: link.targetId,
    dashboardId: link.dashboardId,
    businessId: link.businessId,
    linkId: link.id,
  });

  linkDomain.recordLinkArchivedDomainEvent({
    actorUserId: params.userId,
    linkId: link.id,
    pageId,
    targetType: link.targetType,
    targetId: link.targetId,
    dashboardId: link.dashboardId,
    businessId: link.businessId,
  });
}
