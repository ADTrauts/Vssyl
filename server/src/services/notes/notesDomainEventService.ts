import {
  emitNotesPageCreatedEvent,
  emitNotesPagePermanentlyDeletedEvent,
  emitNotesPageRestoredEvent,
  emitNotesPageSharedEvent,
  emitNotesPageTrashedEvent,
  emitNotesPageUnsharedEvent,
  emitNotesPageUpdatedEvent,
} from '../../events/domainEventEmitters';
import type { NotePageSnapshot } from './notesTypes';

function scopeFromPage(page: NotePageSnapshot) {
  return {
    dashboardId: page.dashboardId,
    businessId: page.businessId,
  };
}

export function recordPageCreatedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): void {
  emitNotesPageCreatedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    ...scopeFromPage(params.page),
  });
}

export function recordPageUpdatedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): void {
  emitNotesPageUpdatedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    ...scopeFromPage(params.page),
  });
}

export function recordPageTrashedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): void {
  emitNotesPageTrashedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    ...scopeFromPage(params.page),
  });
}

export function recordPageRestoredDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): void {
  emitNotesPageRestoredEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    ...scopeFromPage(params.page),
  });
}

export function recordPagePermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): void {
  emitNotesPagePermanentlyDeletedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    ...scopeFromPage(params.page),
  });
}

export function recordPageSharedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
  sharedWithUserId: string;
  role: string;
}): void {
  emitNotesPageSharedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    sharedWithUserId: params.sharedWithUserId,
    role: params.role,
    ...scopeFromPage(params.page),
  });
}

export function recordPageUnsharedDomainEvent(params: {
  actorUserId: string;
  page: NotePageSnapshot;
  sharedWithUserId: string;
}): void {
  emitNotesPageUnsharedEvent({
    actorUserId: params.actorUserId,
    pageId: params.page.id,
    sharedWithUserId: params.sharedWithUserId,
    ...scopeFromPage(params.page),
  });
}
