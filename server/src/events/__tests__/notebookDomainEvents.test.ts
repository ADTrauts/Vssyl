import { describe, expect, it } from 'vitest';
import {
  emitNotebookLinkArchivedEvent,
  emitNotebookLinkCreatedEvent,
} from '../domainEventEmitters';
import { isRegisteredDomainEventType } from '../domainEventRegistry';

describe('notebook domain events', () => {
  it('registers notebook.link.* contracts', () => {
    expect(isRegisteredDomainEventType('notebook.link.created')).toBe(true);
    expect(isRegisteredDomainEventType('notebook.link.archived')).toBe(true);
  });

  it('emitNotebookLinkCreatedEvent uses registered contract', () => {
    const event = emitNotebookLinkCreatedEvent({
      actorUserId: 'u1',
      linkId: 'link-1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'ACTION_SOURCE',
      dashboardId: 'dash-1',
    });
    expect(event.type).toBe('notebook.link.created');
    expect(event.entityId).toBe('link-1');
    expect(event.metadata?.pageId).toBe('page-1');
  });

  it('emitNotebookLinkArchivedEvent includes page context', () => {
    const event = emitNotebookLinkArchivedEvent({
      actorUserId: 'u1',
      linkId: 'link-1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      dashboardId: 'dash-1',
    });
    expect(event.type).toBe('notebook.link.archived');
  });
});
