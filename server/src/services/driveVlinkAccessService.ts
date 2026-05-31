import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  canReadFile,
  canWriteFile,
  canReadFolder,
  canWriteFolder,
} from './drivePermissionHelpers';

export type DriveVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface DriveVlinkAccessResult {
  allowed: boolean;
  state: DriveVlinkEntityState;
  title?: string;
  url?: string;
}

async function userHasDriveFileReadAccess(userId: string, fileId: string): Promise<boolean> {
  if (await canReadFile(userId, fileId)) return true;
  if (await canWriteFile(userId, fileId)) return true;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { folderId: true },
  });
  if (!file?.folderId) return false;
  return userHasDriveFolderReadAccess(userId, file.folderId);
}

async function userHasDriveFolderReadAccess(userId: string, folderId: string): Promise<boolean> {
  if (await canReadFolder(userId, folderId)) return true;
  if (await canWriteFolder(userId, folderId)) return true;
  return false;
}

async function passesDriveFileReadPolicy(
  userId: string,
  fileId: string,
  dashboardId: string | null
): Promise<boolean> {
  const policy = await evaluateDrivePolicyDual({
    userId,
    action: POLICY_ACTIONS.FILE_READ,
    resourceType: 'file',
    resourceId: fileId,
    scope: dashboardId ? { dashboardId } : undefined,
  });
  return !policy.blocked;
}

async function passesDriveFolderReadPolicy(
  userId: string,
  folderId: string,
  dashboardId: string | null
): Promise<boolean> {
  const policy = await evaluateDrivePolicyDual({
    userId,
    action: POLICY_ACTIONS.FILE_READ,
    resourceType: 'folder',
    resourceId: folderId,
    scope: dashboardId ? { dashboardId } : undefined,
  });
  return !policy.blocked;
}

/** Canonical V_Link access path for File Hub files (FH-3A). */
export async function resolveDriveFileForVLink(
  userId: string,
  fileId: string
): Promise<DriveVlinkAccessResult> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { id: true, name: true, trashedAt: true, dashboardId: true },
  });

  if (!file) {
    return { allowed: false, state: 'deleted' };
  }
  if (file.trashedAt) {
    return { allowed: false, state: 'trashed', title: file.name };
  }

  if (!(await userHasDriveFileReadAccess(userId, fileId))) {
    return { allowed: false, state: 'active', title: file.name };
  }
  if (!(await passesDriveFileReadPolicy(userId, fileId, file.dashboardId))) {
    return { allowed: false, state: 'active', title: file.name };
  }

  return {
    allowed: true,
    state: 'active',
    title: file.name,
    url: `/drive?file=${file.id}`,
  };
}

/** Canonical V_Link access path for File Hub folders (FH-3A). */
export async function resolveDriveFolderForVLink(
  userId: string,
  folderId: string
): Promise<DriveVlinkAccessResult> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, name: true, trashedAt: true, dashboardId: true },
  });

  if (!folder) {
    return { allowed: false, state: 'deleted' };
  }
  if (folder.trashedAt) {
    return { allowed: false, state: 'trashed', title: folder.name };
  }

  if (!(await userHasDriveFolderReadAccess(userId, folderId))) {
    return { allowed: false, state: 'active', title: folder.name };
  }
  if (!(await passesDriveFolderReadPolicy(userId, folderId, folder.dashboardId))) {
    return { allowed: false, state: 'active', title: folder.name };
  }

  return {
    allowed: true,
    state: 'active',
    title: folder.name,
    url: `/drive?folder=${folder.id}`,
  };
}

export async function userCanLinkDriveFile(userId: string, fileId: string): Promise<boolean> {
  const result = await resolveDriveFileForVLink(userId, fileId);
  return result.allowed;
}

export async function userCanLinkDriveFolder(userId: string, folderId: string): Promise<boolean> {
  const result = await resolveDriveFolderForVLink(userId, folderId);
  return result.allowed;
}

export const DRIVE_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → driveVlinkAccessService → File Hub permissions + Policy Engine FILE_READ';

export const DRIVE_VLINK_ENTITY_TYPES = [VLinkEntityType.FILE, VLinkEntityType.FOLDER] as const;
