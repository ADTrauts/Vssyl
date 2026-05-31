import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { canReadFile, canReadFolder } from './drivePermissionHelpers';
import type { Prisma } from '@prisma/client';

/** Prisma OR branch: user owns or has explicit file share. */
export function accessibleOwnedOrSharedFileClause(userId: string) {
  return {
    OR: [
      { userId },
      { permissions: { some: { userId, canRead: true } } },
      { permissions: { some: { userId, canWrite: true } } },
    ],
  };
}

/** Prisma OR branch: user owns or has explicit folder share. */
export function accessibleOwnedOrSharedFolderClause(userId: string) {
  return {
    OR: [
      { userId },
      { permissions: { some: { userId, canRead: true } } },
      { permissions: { some: { userId, canWrite: true } } },
    ],
  };
}

export async function listAccessibleTrashedFiles(userId: string) {
  return prisma.file.findMany({
    where: {
      trashedAt: { not: null },
      ...accessibleOwnedOrSharedFileClause(userId),
    },
    select: {
      id: true,
      name: true,
      size: true,
      type: true,
      trashedAt: true,
      userId: true,
      dashboardId: true,
    },
    orderBy: { trashedAt: 'desc' },
  });
}

export async function listAccessibleTrashedFolders(userId: string) {
  return prisma.folder.findMany({
    where: {
      trashedAt: { not: null },
      ...accessibleOwnedOrSharedFolderClause(userId),
    },
    select: {
      id: true,
      name: true,
      trashedAt: true,
      userId: true,
      dashboardId: true,
    },
    orderBy: { trashedAt: 'desc' },
  });
}

export interface ListAccessibleDriveFilesInput {
  userId: string;
  dashboardId?: string | null;
  folderId?: string | null;
  limit?: number;
  applyPolicyEngine?: boolean;
}

export async function listAccessibleDriveFiles(input: ListAccessibleDriveFilesInput) {
  const { userId, dashboardId, folderId, limit = 20, applyPolicyEngine = true } = input;

  const where: {
    trashedAt: null;
    folderId?: string | null;
    dashboardId?: string | null;
    OR: ReturnType<typeof accessibleOwnedOrSharedFileClause>['OR'];
  } = {
    trashedAt: null,
    ...accessibleOwnedOrSharedFileClause(userId),
  };

  if (folderId !== undefined) {
    where.folderId = folderId;
  }
  if (dashboardId !== undefined && dashboardId !== null) {
    where.dashboardId = dashboardId;
  }

  const candidates = await prisma.file.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 50),
    select: {
      id: true,
      name: true,
      type: true,
      size: true,
      dashboardId: true,
      folderId: true,
      userId: true,
    },
  });

  if (!applyPolicyEngine) {
    return candidates;
  }

  return filterFilesByReadPolicy(userId, candidates);
}

export interface DriveBrowseQuery {
  userId: string;
  dashboardId?: string | null;
  starred?: boolean;
}

export interface DriveFileBrowseQuery extends DriveBrowseQuery {
  folderId?: string | null;
}

export interface DriveFolderBrowseQuery extends DriveBrowseQuery {
  parentId?: string | null;
}

async function filterFilesByReadPolicy<T extends { id: string; dashboardId: string | null }>(
  userId: string,
  files: T[]
): Promise<T[]> {
  const allowed: T[] = [];
  for (const file of files) {
    if (!(await canReadFile(userId, file.id))) continue;
    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'file',
      resourceId: file.id,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
    });
    if (!policy.blocked) allowed.push(file);
  }
  return allowed;
}

async function filterFoldersByReadPolicy<T extends { id: string; dashboardId: string | null }>(
  userId: string,
  folders: T[]
): Promise<T[]> {
  const allowed: T[] = [];
  for (const folder of folders) {
    if (!(await canReadFolder(userId, folder.id))) continue;
    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: folder.id,
      scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
    });
    if (!policy.blocked) allowed.push(folder);
  }
  return allowed;
}

/** UI browse: owned + shared active files in a folder context (FH-2). */
export async function listAccessibleDriveFilesForBrowse(query: DriveFileBrowseQuery) {
  const { userId, folderId = null, dashboardId, starred } = query;

  const where: Prisma.FileWhereInput = {
    trashedAt: null,
    ...accessibleOwnedOrSharedFileClause(userId),
    folderId,
  };

  if (starred) {
    where.starred = true;
  } else if (dashboardId !== undefined) {
    where.dashboardId = dashboardId;
  } else {
    where.dashboardId = null;
  }

  const candidates = await prisma.file.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return filterFilesByReadPolicy(userId, candidates);
}

/** UI browse: owned + shared active folders in a parent context (FH-2). */
export async function listAccessibleDriveFoldersForBrowse(query: DriveFolderBrowseQuery) {
  const { userId, parentId = null, dashboardId, starred } = query;

  const where: Prisma.FolderWhereInput = {
    trashedAt: null,
    ...accessibleOwnedOrSharedFolderClause(userId),
    parentId,
  };

  if (starred) {
    where.starred = true;
  } else if (dashboardId !== undefined) {
    where.dashboardId = dashboardId;
  } else {
    where.dashboardId = null;
  }

  const candidates = await prisma.folder.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return filterFoldersByReadPolicy(userId, candidates);
}

export async function validateAccessibleFileIds(userId: string, fileIds: string[]): Promise<{
  accessibleIds: string[];
  deniedIds: string[];
}> {
  if (fileIds.length === 0) {
    return { accessibleIds: [], deniedIds: [] };
  }

  const accessibleIds: string[] = [];
  const deniedIds: string[] = [];

  for (const fileId of fileIds) {
    if (!(await canReadFile(userId, fileId))) {
      deniedIds.push(fileId);
      continue;
    }
    const file = await prisma.file.findFirst({
      where: { id: fileId, trashedAt: null },
      select: { dashboardId: true },
    });
    if (!file) {
      deniedIds.push(fileId);
      continue;
    }
    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'file',
      resourceId: fileId,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
    });
    if (policy.blocked) {
      deniedIds.push(fileId);
    } else {
      accessibleIds.push(fileId);
    }
  }

  return { accessibleIds, deniedIds };
}

const activeFileSelect = {
  id: true,
  name: true,
  size: true,
  path: true,
  url: true,
  type: true,
  createdAt: true,
  dashboardId: true,
  folderId: true,
  userId: true,
} as const;

/** Permission + Policy Engine gate for AI attachment/analysis reads (FH-1). */
export async function fetchAccessibleActiveFiles(userId: string, fileIds: string[]) {
  const { accessibleIds } = await validateAccessibleFileIds(userId, fileIds);
  if (accessibleIds.length === 0) return [];
  return prisma.file.findMany({
    where: { id: { in: accessibleIds }, trashedAt: null },
    select: activeFileSelect,
  });
}

/** Documented permission model for File Hub visibility (FH-1 / FH-2). */
export const DRIVE_TRASH_VISIBILITY_MODEL = {
  files:
    'Owner OR FilePermission.canRead OR FilePermission.canWrite on trashed file; restore/delete requires canWriteFile + PE.',
  folders:
    'Owner OR FolderPermission.canRead OR FolderPermission.canWrite on trashed folder; restore/delete requires canWriteFolder + PE.',
  excludes: 'Items with no permission relation to the requesting user.',
} as const;

export const DRIVE_BROWSE_VISIBILITY_MODEL = {
  files:
    'Owner OR FilePermission (canRead/canWrite) in folder/dashboard context; Policy Engine file:read per row.',
  folders:
    'Owner OR FolderPermission (canRead/canWrite) in parent/dashboard context; Policy Engine file:read on folder resource.',
} as const;
