import type { NotebookLinkEntityType } from '@prisma/client';
import { emitModuleActivityEvent } from '../moduleActivityService';

function activityActionForTarget(targetType: NotebookLinkEntityType, linked: boolean): string {
  if (!linked) {
    return 'unlinked_from_page';
  }
  switch (targetType) {
    case 'TASK':
      return 'linked_task_to_page';
    case 'FILE':
      return 'linked_file_to_page';
    case 'CALENDAR_EVENT':
      return 'linked_event_to_page';
    default:
      return 'linked_to_page';
  }
}

export async function recordLinkCreated(params: {
  actorUserId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  relationshipType: string;
  dashboardId: string;
  businessId: string | null;
  linkId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notebook',
    action: activityActionForTarget(params.targetType, true),
    targetType: 'page',
    targetId: params.pageId,
    dashboardId: params.dashboardId,
    businessId: params.businessId,
    metadata: {
      linkId: params.linkId,
      linkedTargetType: params.targetType,
      linkedTargetId: params.targetId,
      relationshipType: params.relationshipType,
    },
  });
}

export async function recordLinkArchived(params: {
  actorUserId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  dashboardId: string;
  businessId: string | null;
  linkId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notebook',
    action: activityActionForTarget(params.targetType, false),
    targetType: 'page',
    targetId: params.pageId,
    dashboardId: params.dashboardId,
    businessId: params.businessId,
    metadata: {
      linkId: params.linkId,
      linkedTargetType: params.targetType,
      linkedTargetId: params.targetId,
    },
  });
}
