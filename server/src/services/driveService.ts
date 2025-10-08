import { prisma } from '../lib/prisma';

export async function getOrCreateChatFilesFolder(userId: string) {
  // Try to find the folder first
  let folder = await prisma.folder.findFirst({
    where: {
      userId,
      name: 'Chat Files',
      parentId: null,
      trashedAt: null,
    },
  });

  if (!folder) {
    folder = await prisma.folder.create({
      data: {
        userId,
        name: 'Chat Files',
        parentId: null,
      },
    });
  }

  return folder;
} 