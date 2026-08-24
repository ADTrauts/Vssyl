import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { canReadFile, canReadFolder } from './drivePermissionHelpers';
import type { Folder, Prisma } from '@prisma/client';

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
  const contextWhere: Prisma.FolderWhereInput = { trashedAt: { not: null } };
  return listOwnedAndSharedFolders(userId, contextWhere, {
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildFolderBrowseContextWhere(query: Pick<DriveFolderBrowseQuery, 'parentId' | 'dashboardId' | 'starred'>): Prisma.FolderWhereInput {
  const { parentId = null, dashboardId, starred } = query;
  const where: Prisma.FolderWhereInput = {
    trashedAt: null,
    parentId,
  };

  if (starred) {
    where.starred = true;
  } else if (dashboardId !== undefined) {
    where.dashboardId = dashboardId;
  } else {
    where.dashboardId = null;
  }

  return where;
}

/** FolderPermission rows for shared visibility; owned-only fallback when lookup fails. */
async function listSharedFolderIdsForUser(userId: string): Promise<string[]> {
  try {
    const permissions = await prisma.folderPermission.findMany({
      where: {
        userId,
        OR: [{ canRead: true }, { canWrite: true }],
      },
      select: { folderId: true },
    });
    return [...new Set(permissions.map((permission) => permission.folderId))];
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('FolderPermission lookup failed; using owned-only folder visibility', {
      operation: 'drive_folder_permission_lookup',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function listOwnedAndSharedFolders<T extends Folder>(
  userId: string,
  contextWhere: Prisma.FolderWhereInput,
  findArgs: Omit<Prisma.FolderFindManyArgs, 'where'>
): Promise<T[]> {
  const owned = (await prisma.folder.findMany({
    where: { AND: [contextWhere, { userId }] },
    ...findArgs,
  })) as T[];

  const sharedIds = await listSharedFolderIdsForUser(userId);
  if (sharedIds.length === 0) {
    return owned;
  }

  const shared = (await prisma.folder.findMany({
    where: {
      AND: [contextWhere, { id: { in: sharedIds }, NOT: { userId } }],
    },
    ...findArgs,
  })) as T[];

  return dedupeById([...owned, ...shared]);
}

/** Count active child folders visible to the user (browse hasChildren helper). */
export async function countAccessibleChildFolders(userId: string, parentFolderId: string): Promise<number> {
  const children = await listOwnedAndSharedFolders(userId, { parentId: parentFolderId, trashedAt: null }, {
    select: { id: true, dashboardId: true },
  });
  const allowed = await filterFoldersByReadPolicy(userId, children);
  return allowed.length;
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
    try {
      if (!(await canReadFolder(userId, folder.id))) continue;
      const policy = await evaluateDrivePolicyDual({
        userId,
        action: POLICY_ACTIONS.FILE_READ,
        resourceType: 'folder',
        resourceId: folder.id,
        scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
      });
      if (!policy.blocked) allowed.push(folder);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Drive folder read policy check failed; skipping row', {
        operation: 'drive_folder_read_policy',
        userId,
        folderId: folder.id,
        error: { message: err.message },
      });
    }
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
  const contextWhere = buildFolderBrowseContextWhere({ parentId, dashboardId, starred });
  const candidates = await listOwnedAndSharedFolders(userId, contextWhere, {
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
  updatedAt: true,
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

export type DriveSearchMimeCategory = 'documents' | 'spreadsheets' | 'images' | 'videos';

export interface DriveSearchFilters {
  dateStart?: Date;
  dateEnd?: Date;
  pinnedOnly?: boolean;
  driveMimeCategory?: DriveSearchMimeCategory;
}

function buildDriveMimeCategoryCondition(
  driveMimeCategory: DriveSearchMimeCategory | undefined
): Prisma.FileWhereInput | null {
  if (!driveMimeCategory) return null;

  const mimeConditions: Prisma.FileWhereInput[] = [];
  if (driveMimeCategory === 'documents') {
    mimeConditions.push(
      { type: { contains: 'pdf', mode: 'insensitive' } },
      { type: { contains: 'word', mode: 'insensitive' } },
      { type: { contains: 'document', mode: 'insensitive' } }
    );
  } else if (driveMimeCategory === 'spreadsheets') {
    mimeConditions.push(
      { type: { contains: 'excel', mode: 'insensitive' } },
      { type: { contains: 'spreadsheet', mode: 'insensitive' } }
    );
  } else if (driveMimeCategory === 'images') {
    mimeConditions.push({ type: { startsWith: 'image/', mode: 'insensitive' } });
  } else if (driveMimeCategory === 'videos') {
    mimeConditions.push({ type: { startsWith: 'video/', mode: 'insensitive' } });
  }

  return mimeConditions.length > 0 ? { OR: mimeConditions } : null;
}

function buildDriveSearchDateCondition(filters?: DriveSearchFilters): Prisma.FileWhereInput | null {
  if (!filters?.dateStart && !filters?.dateEnd) return null;
  return {
    updatedAt: {
      ...(filters.dateStart ? { gte: filters.dateStart } : {}),
      ...(filters.dateEnd ? { lte: filters.dateEnd } : {}),
    },
  };
}

/** Federated search: owned + shared active files with PE read gate (FH-4). */
export async function searchAccessibleDriveFiles(
  userId: string,
  query: string,
  filters?: DriveSearchFilters,
  limit = 10
) {
  const andConditions: Prisma.FileWhereInput[] = [
    {
      OR: [{ name: { contains: query, mode: 'insensitive' } }],
    },
    accessibleOwnedOrSharedFileClause(userId),
    { trashedAt: null },
  ];

  const dateCondition = buildDriveSearchDateCondition(filters);
  if (dateCondition) andConditions.push(dateCondition);
  if (filters?.pinnedOnly) andConditions.push({ starred: true });

  const mimeCondition = buildDriveMimeCategoryCondition(filters?.driveMimeCategory);
  if (mimeCondition) andConditions.push(mimeCondition);

  const candidates = await prisma.file.findMany({
    where: { AND: andConditions },
    include: { folder: true },
    take: Math.min(Math.max(limit, 1), 25),
    orderBy: { updatedAt: 'desc' },
  });

  return filterFilesByReadPolicy(userId, candidates);
}

/** Federated search: owned + shared active folders with PE read gate (FH-4). */
export async function searchAccessibleDriveFolders(
  userId: string,
  query: string,
  filters?: DriveSearchFilters,
  limit = 5
) {
  const contextWhere: Prisma.FolderWhereInput = {
    name: { contains: query, mode: 'insensitive' },
    trashedAt: null,
  };

  if (filters?.dateStart || filters?.dateEnd) {
    contextWhere.updatedAt = {
      ...(filters.dateStart ? { gte: filters.dateStart } : {}),
      ...(filters.dateEnd ? { lte: filters.dateEnd } : {}),
    };
  }
  if (filters?.pinnedOnly) contextWhere.starred = true;

  const candidates = await listOwnedAndSharedFolders(userId, contextWhere, {
    take: Math.min(Math.max(limit, 1), 15),
    orderBy: { updatedAt: 'desc' },
  });

  return filterFoldersByReadPolicy(userId, candidates);
}

export const DRIVE_SEARCH_VISIBILITY_MODEL = {
  files:
    'Same as browse: owner OR FilePermission; Policy Engine file:read per hit; trashed excluded.',
  folders:
    'Same as browse: owner OR FolderPermission; Policy Engine file:read on folder; trashed excluded.',
} as const;

/** Row shape for Drive AI context providers (recent / shared files). */
export function driveAIContextFileSelectForUser(userId: string) {
  return {
    id: true,
    name: true,
    type: true,
    size: true,
    createdAt: true,
    updatedAt: true,
    starred: true,
    folderId: true,
    dashboardId: true,
    userId: true,
    user: {
      select: {
        id: true,
        name: true,
      },
    },
    folder: {
      select: {
        id: true,
        name: true,
      },
    },
    permissions: {
      where: { userId },
      select: {
        canRead: true,
        canWrite: true,
      },
    },
  } as const;
}

/** @deprecated Prefer driveAIContextFileSelectForUser — kept for call-site discovery. */
export const driveAIContextFileSelect = {
  id: true,
  name: true,
  type: true,
  size: true,
  createdAt: true,
  updatedAt: true,
  starred: true,
  folderId: true,
  dashboardId: true,
  folder: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export type DriveAIContextFileRow = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  folderId: string | null;
  dashboardId: string | null;
  userId: string;
  user: { id: string; name: string | null };
  folder: { id: string; name: string } | null;
  permissions: Array<{ canRead: boolean; canWrite: boolean }>;
};

export interface DriveAIContextListInput {
  userId: string;
  dashboardId?: string | null;
  limit?: number;
}

function buildAccessibleActiveFileWhere(
  userId: string,
  dashboardId?: string | null
): Prisma.FileWhereInput {
  const where: Prisma.FileWhereInput = {
    trashedAt: null,
    ...accessibleOwnedOrSharedFileClause(userId),
  };
  if (dashboardId !== undefined && dashboardId !== null) {
    where.dashboardId = dashboardId;
  }
  return where;
}

/**
 * Product shared-files query — same semantics as GET /api/drive/shared files branch.
 * Owner included; share grantor is not stored on FilePermission.
 */
export async function listSharedFilesWithOwner(userId: string) {
  return prisma.file.findMany({
    where: {
      trashedAt: null,
      permissions: {
        some: {
          userId,
          canRead: true,
        },
      },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      permissions: {
        where: { userId },
        select: { canRead: true, canWrite: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Product shared-folders query — same semantics as GET /api/drive/shared folders branch.
 */
export async function listSharedFoldersWithOwner(userId: string) {
  return prisma.folder.findMany({
    where: {
      trashedAt: null,
      permissions: {
        some: {
          userId,
          canRead: true,
        },
      },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      permissions: {
        where: { userId },
        select: { canRead: true, canWrite: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Recent files for AI context — owned + shared, PE-gated, excludes trashed (Wave 1C).
 * Includes owner + current-user permission rows for share/owner truth (D2).
 */
export async function listAccessibleRecentFilesForAIContext(
  input: DriveAIContextListInput
): Promise<DriveAIContextFileRow[]> {
  const { userId, dashboardId, limit = 10 } = input;
  const candidates = await prisma.file.findMany({
    where: buildAccessibleActiveFileWhere(userId, dashboardId),
    select: driveAIContextFileSelectForUser(userId),
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(Math.max(limit, 1), 50),
  });
  return filterFilesByReadPolicy(userId, candidates);
}

/**
 * Shared-with-me files for AI — authorization-first (FilePermission + PE), excludes trashed.
 * Does not assert share grantor (schema has no grantor field).
 */
export async function listSharedFilesForAIContext(
  input: DriveAIContextListInput
): Promise<DriveAIContextFileRow[]> {
  const { userId, dashboardId, limit = 25 } = input;
  const where: Prisma.FileWhereInput = {
    trashedAt: null,
    permissions: {
      some: {
        userId,
        canRead: true,
      },
    },
  };
  if (dashboardId !== undefined && dashboardId !== null) {
    where.dashboardId = dashboardId;
  }
  const candidates = await prisma.file.findMany({
    where,
    select: driveAIContextFileSelectForUser(userId),
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(Math.max(limit, 1), 50),
  });
  return filterFilesByReadPolicy(userId, candidates);
}

export interface DriveAIContextStorageAggregate {
  totalFiles: number;
  documentFiles: number;
  imageFiles: number;
  videoFiles: number;
  storageUsedBytes: number;
}

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
] as const;

function classifyFileTypeForStorage(type: string): 'documents' | 'images' | 'videos' | 'other' {
  if (DOCUMENT_MIME_TYPES.includes(type as (typeof DOCUMENT_MIME_TYPES)[number])) {
    return 'documents';
  }
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'videos';
  return 'other';
}

/**
 * Storage aggregate for AI context — PE-gated over accessible active files (Wave 1C).
 */
export async function aggregateAccessibleDriveStorageForAIContext(
  input: DriveAIContextListInput
): Promise<DriveAIContextStorageAggregate> {
  const { userId, dashboardId } = input;
  const candidates = await prisma.file.findMany({
    where: buildAccessibleActiveFileWhere(userId, dashboardId),
    select: { id: true, size: true, type: true, dashboardId: true },
  });
  const allowed = await filterFilesByReadPolicy(userId, candidates);

  let documentFiles = 0;
  let imageFiles = 0;
  let videoFiles = 0;
  let storageUsedBytes = 0;

  for (const file of allowed) {
    storageUsedBytes += file.size || 0;
    const bucket = classifyFileTypeForStorage(file.type);
    if (bucket === 'documents') documentFiles += 1;
    else if (bucket === 'images') imageFiles += 1;
    else if (bucket === 'videos') videoFiles += 1;
  }

  return {
    totalFiles: allowed.length,
    documentFiles,
    imageFiles,
    videoFiles,
    storageUsedBytes,
  };
}

export interface DriveAIContextCountInput extends DriveAIContextListInput {
  type?: 'all' | 'folder' | 'recent';
  folderId?: string | null;
}

/**
 * File count for AI query endpoint — PE-gated (Wave 1C).
 */
export async function countAccessibleDriveFilesForAIContext(
  input: DriveAIContextCountInput
): Promise<number> {
  const { userId, dashboardId, type = 'all', folderId } = input;
  const where = buildAccessibleActiveFileWhere(userId, dashboardId);

  if (type === 'folder' && folderId) {
    where.folderId = folderId;
  } else if (type === 'recent') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    where.updatedAt = { gte: sevenDaysAgo };
  }

  const candidates = await prisma.file.findMany({
    where,
    select: { id: true, dashboardId: true },
  });
  const allowed = await filterFilesByReadPolicy(userId, candidates);
  return allowed.length;
}

export const DRIVE_AI_CONTEXT_VISIBILITY_MODEL = {
  recent:
    'Owner OR FilePermission; trashedAt null; Policy Engine file:read per row; ordered by updatedAt.',
  storage:
    'Same visibility as recent; aggregate counts/sizes over PE-allowed active files only.',
  count: 'Same visibility; optional folder or 7-day recent filter.',
} as const;
