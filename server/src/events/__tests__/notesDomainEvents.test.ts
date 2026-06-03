import { describe, expect, it } from 'vitest';
import { emitNotesPageCreatedEvent, emitNotesPageTrashedEvent } from '../domainEventEmitters';
import { isRegisteredDomainEventType } from '../domainEventRegistry';

describe('notes domain events', () => {
  it('registers notes.page.* contracts', () => {
    expect(isRegisteredDomainEventType('notes.page.created')).toBe(true);
    expect(isRegisteredDomainEventType('notes.page.trashed')).toBe(true);
    expect(isRegisteredDomainEventType('notes.page.shared')).toBe(true);
  });

  it('emitNotesPageCreatedEvent uses registered contract', () => {
    const event = emitNotesPageCreatedEvent({
      actorUserId: 'u1',
      pageId: 'page-1',
      dashboardId: 'dash-1',
    });
    expect(event.type).toBe('notes.page.created');
    expect(event.entityId).toBe('page-1');
  });

  it('emitNotesPageTrashedEvent includes softDelete metadata', () => {
    const event = emitNotesPageTrashedEvent({
      actorUserId: 'u1',
      pageId: 'page-1',
      dashboardId: 'dash-1',
    });
    expect(event.type).toBe('notes.page.trashed');
    expect(event.metadata?.softDelete).toBe(true);
  });
});
