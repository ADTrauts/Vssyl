import { prisma } from '../utils/prisma.js'

export async function logActivity({ userId, folderId, fileId, action, message, io = null }) {
  try {
    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    const entry = await prisma.activityLog.create({
      data: {
        userId,
        folderId,
        fileId,
        action,
        message
      }
    })

    // Emit real-time activity log to folder room
    if (io && folderId) {
      io.to(folderId).emit('activity:new', {
        ...entry,
        user // 🔥 Full user info for UI display
      })
    }

    return entry
  } catch (err) {
    console.error('Activity logging failed:', err)
  }
}
