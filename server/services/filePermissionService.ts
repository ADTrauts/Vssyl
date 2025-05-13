import { PrismaClient, FileAccess, Permission } from '@prisma/client';

const prisma = new PrismaClient();

export class FilePermissionService {
  async grantAccess(
    fileId: string,
    userId: string,
    permission: Permission
  ): Promise<FileAccess> {
    return prisma.fileAccess.upsert({
      where: {
        fileId_userId: {
          fileId,
          userId,
        },
      },
      update: {
        permission,
      },
      create: {
        fileId,
        userId,
        permission,
      },
    });
  }

  async revokeAccess(fileId: string, userId: string): Promise<void> {
    await prisma.fileAccess.delete({
      where: {
        fileId_userId: {
          fileId,
          userId,
        },
      },
    });
  }

  async getFileAccess(fileId: string): Promise<FileAccess[]> {
    return prisma.fileAccess.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async checkAccess(
    fileId: string,
    userId: string,
    requiredPermission: Permission = 'READ'
  ): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        access: {
          where: { userId },
        },
      },
    });

    if (!file) return false;

    // Owner has all permissions
    if (file.ownerId === userId) return true;

    // Check explicit access
    const access = file.access[0];
    if (!access) return false;

    // READ permission is sufficient for all operations
    if (access.permission === 'READ') return true;

    // WRITE permission is required for write operations
    return access.permission === 'WRITE' && requiredPermission === 'WRITE';
  }

  async transferOwnership(fileId: string, newOwnerId: string): Promise<void> {
    await prisma.$transaction([
      // Update file owner
      prisma.file.update({
        where: { id: fileId },
        data: { ownerId: newOwnerId },
      }),
      // Remove existing access for the new owner
      prisma.fileAccess.deleteMany({
        where: {
          fileId,
          userId: newOwnerId,
        },
      }),
    ]);
  }
}

export const filePermissionService = new FilePermissionService(); 