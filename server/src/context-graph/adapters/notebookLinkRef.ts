import type { NotebookLinkEntityType } from '@prisma/client';
import type { EntityRef } from '../contextGraphTypes.js';

/** Map NotebookLink target types to federation entity refs — no synthetic edges. */
export function notebookLinkTargetToRef(
  targetType: NotebookLinkEntityType,
  targetId: string
): EntityRef | null {
  switch (targetType) {
    case 'PAGE':
      return { moduleId: 'notebook', entityType: 'notebook_page', entityId: targetId };
    case 'TASK':
      return { moduleId: 'todo', entityType: 'task', entityId: targetId };
    case 'FILE':
      return { moduleId: 'drive', entityType: 'file', entityId: targetId };
    case 'CALENDAR_EVENT':
      return { moduleId: 'calendar', entityType: 'event', entityId: targetId };
    case 'CHAT_CONVERSATION':
      return { moduleId: 'chat', entityType: 'conversation', entityId: targetId };
    case 'PLACE_LISTING':
      return { moduleId: 'place', entityType: 'place_list', entityId: targetId };
    default:
      return null;
  }
}

export function notebookLinkSourceToRef(sourceType: NotebookLinkEntityType, sourceId: string): EntityRef | null {
  if (sourceType === 'PAGE') {
    return { moduleId: 'notebook', entityType: 'notebook_page', entityId: sourceId };
  }
  return notebookLinkTargetToRef(sourceType, sourceId);
}
