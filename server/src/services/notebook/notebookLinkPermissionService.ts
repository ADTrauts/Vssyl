import type { Note, NotebookLinkEntityType } from '@prisma/client';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { prisma } from '../../lib/prisma';
import { assertCanReadPage, assertCanWritePage } from '../notes/notesPermissionService';
import { getTaskByIdIfAccessible } from '../todoVisibilityService';
import { validateAccessibleFileIds } from '../driveVisibilityService';
import { userCanAccessCalendarEvent } from './notebookLinkVisibilityService';
import { NotebookLinkServiceError } from './notebookLinkErrors';
import { evaluateNotebookLinkPolicyDual } from './notebookPolicyDual';

const METADATA_MAX_BYTES = 4096;

async function assertLinkPolicyNotBlocked(params: {
  userId: string;
  action: typeof POLICY_ACTIONS.NOTEBOOK_LINK_READ | typeof POLICY_ACTIONS.NOTEBOOK_LINK_WRITE;
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string };
}): Promise<void> {
  const policyBlock = await evaluateNotebookLinkPolicyDual({
    userId: params.userId,
    action: params.action,
    resourceId: params.resourceId,
    scope: params.scope,
  });
  if (policyBlock.blocked) {
    throw new NotebookLinkServiceError('Not authorized', 'forbidden', 403);
  }
}

export function validateLinkMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  const serialized = JSON.stringify(metadata);
  if (serialized.length > METADATA_MAX_BYTES) {
    throw new NotebookLinkServiceError('Metadata exceeds size limit', 'invalid', 400);
  }
  return metadata;
}

function assertBusinessContextAligned(
  page: Pick<Note, 'dashboardId' | 'businessId'>,
  targetBusinessId: string | null | undefined
): void {
  const pageBiz = page.businessId ?? null;
  const targetBiz = targetBusinessId ?? null;
  if (pageBiz !== targetBiz) {
    throw new NotebookLinkServiceError('Target is not in the same workspace context as the page', 'invalid', 400);
  }
}

export async function assertCanReadPageLinks(userId: string, pageId: string) {
  const page = await assertCanReadPage(pageId, userId);
  await assertLinkPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.NOTEBOOK_LINK_READ,
    resourceId: pageId,
    scope: { dashboardId: page.dashboardId, businessId: page.businessId ?? undefined },
  });
  return page;
}

export async function assertCanCreatePageLink(params: {
  userId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
}) {
  const page = await assertCanWritePage(params.pageId, params.userId);
  await assertLinkPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.NOTEBOOK_LINK_WRITE,
    resourceId: params.pageId,
    scope: { dashboardId: page.dashboardId, businessId: page.businessId ?? undefined },
  });

  await assertTargetReadable({
    userId: params.userId,
    page,
    targetType: params.targetType,
    targetId: params.targetId,
  });

  return page;
}

export async function assertTargetReadable(params: {
  userId: string;
  page: Pick<Note, 'dashboardId' | 'businessId'>;
  targetType: NotebookLinkEntityType;
  targetId: string;
}): Promise<void> {
  const { userId, page, targetType, targetId } = params;

  switch (targetType) {
    case 'TASK': {
      const task = await getTaskByIdIfAccessible(userId, targetId);
      if (!task || task.trashedAt) {
        throw new NotebookLinkServiceError('Task not found', 'not_found', 404);
      }
      if (task.dashboardId !== page.dashboardId) {
        throw new NotebookLinkServiceError('Task is not in the same dashboard as the page', 'invalid', 400);
      }
      assertBusinessContextAligned(page, task.businessId);
      return;
    }
    case 'FILE': {
      const { accessibleIds, deniedIds } = await validateAccessibleFileIds(userId, [targetId]);
      if (deniedIds.length > 0 || accessibleIds.length === 0) {
        throw new NotebookLinkServiceError('File not found', 'not_found', 404);
      }
      const file = await prisma.file.findFirst({
        where: { id: targetId, trashedAt: null },
        select: { dashboardId: true },
      });
      if (!file) {
        throw new NotebookLinkServiceError('File not found', 'not_found', 404);
      }
      if (file.dashboardId && file.dashboardId !== page.dashboardId) {
        throw new NotebookLinkServiceError('File is not in the same dashboard as the page', 'invalid', 400);
      }
      return;
    }
    case 'CALENDAR_EVENT': {
      const allowed = await userCanAccessCalendarEvent(userId, targetId);
      if (!allowed) {
        throw new NotebookLinkServiceError('Event not found', 'not_found', 404);
      }
      return;
    }
    case 'CHAT_CONVERSATION':
    case 'PLACE_LISTING':
      throw new NotebookLinkServiceError(
        `${targetType} links are not supported in this release`,
        'unsupported',
        400
      );
    case 'PAGE':
      throw new NotebookLinkServiceError('Cannot link a page to itself as target', 'invalid', 400);
    default:
      throw new NotebookLinkServiceError('Unsupported target type', 'invalid', 400);
  }
}

export async function assertCanReadEntityBacklinks(params: {
  userId: string;
  entityType: NotebookLinkEntityType;
  entityId: string;
}): Promise<void> {
  switch (params.entityType) {
    case 'CALENDAR_EVENT': {
      const allowed = await userCanAccessCalendarEvent(params.userId, params.entityId);
      if (!allowed) {
        throw new NotebookLinkServiceError('Event not found', 'not_found', 404);
      }
      return;
    }
    case 'TASK': {
      const task = await getTaskByIdIfAccessible(params.userId, params.entityId);
      if (!task) {
        throw new NotebookLinkServiceError('Task not found', 'not_found', 404);
      }
      return;
    }
    default:
      throw new NotebookLinkServiceError(
        `Backlinks for ${params.entityType} are not supported in this release`,
        'unsupported',
        400
      );
  }
}

export async function assertCanArchiveLink(params: {
  userId: string;
  linkId: string;
}) {
  const link = await prisma.notebookLink.findFirst({
    where: { id: params.linkId, archivedAt: null },
  });
  if (!link) {
    throw new NotebookLinkServiceError('Link not found', 'not_found', 404);
  }

  const pageId =
    link.sourceType === 'PAGE'
      ? link.sourceId
      : link.targetType === 'PAGE'
        ? link.targetId
        : null;

  if (!pageId) {
    throw new NotebookLinkServiceError('Link not found', 'not_found', 404);
  }

  try {
    await assertCanWritePage(pageId, params.userId);
  } catch {
    if (link.createdById !== params.userId) {
      throw new NotebookLinkServiceError('Not authorized', 'forbidden', 403);
    }
  }

  await assertLinkPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.NOTEBOOK_LINK_WRITE,
    resourceId: link.id,
    scope: { dashboardId: link.dashboardId, businessId: link.businessId ?? undefined },
  });

  return { link, pageId };
}
