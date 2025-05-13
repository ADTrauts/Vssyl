// cron/autoCleanup.js
import cron from 'node-cron'
import { prisma } from '../utils/prisma.js'

export function startAutoCleanup() {
  // Runs every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date()
      const cutoff = new Date(now.setDate(now.getDate() - 30))

      const deletedFiles = await prisma.file.deleteMany({
        where: { deletedAt: { lte: cutoff } }
      })

      const deletedFolders = await prisma.folder.deleteMany({
        where: { deletedAt: { lte: cutoff } }
      })

      console.log(`🧹 Auto-cleanup ran: Deleted ${deletedFiles.count} files, ${deletedFolders.count} folders`)
    } catch (err) {
      console.error('❌ Auto-cleanup failed:', err)
    }
  })

  console.log('🕒 Auto-cleanup cron job scheduled (runs daily at midnight)')
}
