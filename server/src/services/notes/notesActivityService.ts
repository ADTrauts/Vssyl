import { emitModuleActivityEvent } from '../moduleActivityService';
import type { NotePageSnapshot } from './notesTypes';

function pageScope(page: NotePageSnapshot) {
  return {
    dashboardId: page.dashboardId,
    businessId: page.businessId,
  };
}

export async function recordPageCreated(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'create',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
    metadata: { title: params.page.title },
  });
}

export async function recordPageUpdated(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'update',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
    metadata: { title: params.page.title, pinned: params.page.pinned },
  });
}

export async function recordPageTrashed(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'delete',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
    metadata: { softDelete: true },
  });
}

export async function recordPageRestored(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'restore',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
  });
}

export async function recordPagePermanentlyDeleted(params: {
  actorUserId: string;
  page: NotePageSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'permanent_delete',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
  });
}

export async function recordPageShared(params: {
  actorUserId: string;
  page: NotePageSnapshot;
  sharedWithUserId: string;
  role: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'share',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
    metadata: { sharedWithUserId: params.sharedWithUserId, role: params.role },
  });
}

export async function recordPageUnshared(params: {
  actorUserId: string;
  page: NotePageSnapshot;
  sharedWithUserId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'notes',
    action: 'unshare',
    targetType: 'page',
    targetId: params.page.id,
    ...pageScope(params.page),
    metadata: { sharedWithUserId: params.sharedWithUserId },
  });
}
