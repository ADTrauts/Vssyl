import { prisma } from '../utils/prisma.js'

export async function checkAccess(userId, { folderId, fileId }) {
  const access = await prisma.accessControl.findFirst({
    where: {
      userId,
      OR: [
        folderId ? { folderId } : undefined,
        fileId ? { fileId } : undefined
      ]
    }
  })
  return access?.access || null // returns 'view', 'edit', or 'owner'
}
