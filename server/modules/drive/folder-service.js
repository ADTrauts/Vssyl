import { prisma } from '../../utils/prisma.js'
import { nanoid } from 'nanoid'
import { formatBytes } from '../../utils/index.js'

class FolderService {
  async createFolder(data) {
    return prisma.folder.create({
      data
    })
  }

  async getFolders(userId, parentId = null) {
    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        parentId,
        deletedAt: null
      }
    })
  }

  async getFolderById(id) {
    return prisma.folder.findUnique({
      where: { id }
    })
  }

  async updateFolder(id, data) {
    return prisma.folder.update({
      where: { id },
      data
    })
  }

  async deleteFolder(id) {
    return prisma.folder.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
  }

  async getFolderStats(folderId) {
    const [files, subfolders] = await Promise.all([
      prisma.file.findMany({
        where: { folderId, deletedAt: null },
        select: { size: true }
      }),
      prisma.folder.findMany({
        where: { parentId: folderId, deletedAt: null }
      })
    ])

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const fileCount = files.length
    const folderCount = subfolders.length

    return { fileCount, folderCount, totalSize }
  }

  async getFolderDetails(folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        accessControls: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    })

    if (!folder) {
      throw new Error('Folder not found')
    }

    const stats = await this.getFolderStats(folderId)
    return { folder, stats }
  }

  async toggleStar(folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      throw new Error('Folder not found')
    }

    return this.updateFolder(folderId, {
      isStarred: !folder.isStarred
    })
  }

  async updateTags(folderId, tags) {
    return this.updateFolder(folderId, {
      tags
    })
  }

  async getRecentFolders(userId, limit = 10) {
    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        deletedAt: null
      },
      orderBy: {
        lastAccessed: 'desc'
      },
      take: limit
    })
  }

  async getStarredFolders(userId) {
    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        isStarred: true,
        deletedAt: null
      },
      orderBy: {
        lastAccessed: 'desc'
      }
    })
  }

  async getSharedFolders(userId) {
    return prisma.folder.findMany({
      where: {
        accessControls: {
          some: {
            userId,
            access: { in: ['VIEW', 'EDIT'] }
          }
        },
        deletedAt: null
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })
  }
}

export const folderService = new FolderService() 