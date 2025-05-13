import { prisma } from '../../utils/prisma.js'
import { nanoid } from 'nanoid'
import { formatBytes } from '../../utils/index.js'

class FileService {
  // ... existing code ...

  async moveFile(fileId, newFolderId) {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      throw new Error('File not found')
    }

    // If moving to root, set folderId to null
    const folderId = newFolderId === 'root' ? null : newFolderId

    // Update the file's folderId
    return prisma.file.update({
      where: { id: fileId },
      data: {
        folderId,
        updatedAt: new Date()
      }
    })
  }

  // ... rest of the file
}

export const fileService = new FileService() 