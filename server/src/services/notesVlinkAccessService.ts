import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateNotesPolicyDual } from './notes/notesPolicyDual';
import { buildPageOwnerOrSharedReadWhere } from './notes/notesPermissionService';

export type NotesVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface NotesVlinkAccessResult {
  allowed: boolean;
  state: NotesVlinkEntityState;
  title?: string;
  url?: string;
}

async function passesNoteReadPolicy(
  userId: string,
  noteId: string,
  scope: { dashboardId: string; businessId: string | null }
): Promise<boolean> {
  const policy = await evaluateNotesPolicyDual({
    userId,
    action: POLICY_ACTIONS.NOTES_PAGE_READ,
    resourceId: noteId,
    scope: {
      dashboardId: scope.dashboardId,
      businessId: scope.businessId ?? undefined,
    },
  });
  return !policy.blocked;
}

/**
 * Canonical V_Link access for notes (CG-1B / CG-F-004).
 * V_Link membership alone does not grant note content — owner/share legacy access
 * and Policy Engine NOTES_PAGE_READ must pass.
 */
export async function resolveNoteForVLink(
  userId: string,
  noteId: string
): Promise<NotesVlinkAccessResult> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      dashboardId: true,
      businessId: true,
      createdById: true,
      shares: {
        where: { sharedWithUserId: userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!note) {
    return { allowed: false, state: 'deleted' };
  }

  if (note.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: note.title,
    };
  }

  const readable = await prisma.note.findFirst({
    where: buildPageOwnerOrSharedReadWhere(userId, noteId),
    select: { id: true },
  });

  if (!readable) {
    return {
      allowed: false,
      state: 'active',
      title: note.title,
    };
  }

  if (
    !(await passesNoteReadPolicy(userId, noteId, {
      dashboardId: note.dashboardId,
      businessId: note.businessId,
    }))
  ) {
    return {
      allowed: false,
      state: 'active',
      title: note.title,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: note.title,
    url: `/notebook/page/${note.id}`,
  };
}

export async function userCanLinkNote(userId: string, noteId: string): Promise<boolean> {
  const result = await resolveNoteForVLink(userId, noteId);
  return result.allowed;
}

export const NOTES_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → notesVlinkAccessService → owner/share + Policy Engine NOTES_PAGE_READ';
