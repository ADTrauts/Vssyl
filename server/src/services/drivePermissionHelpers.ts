import { prisma } from '../lib/prisma';

/** Mirrors legacy fileController permission checks (owner or FilePermission.canWrite). */
export async function canWriteFile(userId: string, fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;
  if (file.userId === userId) return true;
  const perm = await prisma.filePermission.findFirst({
    where: { fileId, userId, canWrite: true },
  });
  return !!perm;
}

/** Mirrors legacy fileController permission checks (owner or FilePermission.canRead). */
export async function canReadFile(userId: string, fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;
  if (file.userId === userId) return true;
  const perm = await prisma.filePermission.findFirst({
    where: { fileId, userId, canRead: true },
  });
  return !!perm;
}

/** Mirrors folderPermissionController (owner or FolderPermission.canWrite). */
export async function canWriteFolder(userId: string, folderId: string): Promise<boolean> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return false;
  if (folder.userId === userId) return true;
  const perm = await prisma.folderPermission.findFirst({
    where: { folderId, userId, canWrite: true },
  });
  return !!perm;
}

/** Mirrors folderPermissionController (owner or FolderPermission.canRead). */
export async function canReadFolder(userId: string, folderId: string): Promise<boolean> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return false;
  if (folder.userId === userId) return true;
  const perm = await prisma.folderPermission.findFirst({
    where: { folderId, userId, canRead: true },
  });
  return !!perm;
}
