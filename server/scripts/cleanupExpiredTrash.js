import { prisma } from '../utils/prisma.js'

const DAYS_TO_LIVE = 30
const now = new Date()
const cutoff = new Date(now.setDate(now.getDate() - DAYS_TO_LIVE))

async function deleteExpiredItems() {
  const expiredFiles = await prisma.file.deleteMany({
    where: {
      deletedAt: { lte: cutoff }
    }
  })

  const expiredFolders = await prisma.folder.deleteMany({
    where: {
      deletedAt: { lte: cutoff }
    }
  })

  console.log(`Deleted ${expiredFiles.count} files and ${expiredFolders.count} folders.`)
  process.exit(0)
}

deleteExpiredItems().catch(err => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
