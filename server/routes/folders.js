import express from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { logActivity } from '../utils/logActivity.js'
import { folderService } from '../modules/drive/folder-service.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import { generateUniqueName } from '../utils/fileUtils.js'

const router = express.Router()

// 🗑️ List folders in trash
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: req.user.id,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    })
    res.json({ folders })
  } catch (err) {
    console.error('[GET /folders/trash] Failed:', err)
    res.status(500).json({ error: 'Failed to retrieve trash folders' })
  }
})

// 🔄 Restore a folder from trash
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const folder = await prisma.folder.update({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      data: {
        deletedAt: null
      }
    })

    await logActivity(req.user.id, 'folder_restored', { folderId: folder.id })
    res.json({ folder })
  } catch (err) {
    console.error('[POST /folders/:id/restore] Failed:', err)
    res.status(500).json({ error: 'Failed to restore folder' })
  }
})

// 🗑️ Permanently delete a folder
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const folder = await prisma.folder.delete({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    })

    await logActivity(req.user.id, 'folder_deleted_permanently', { folderId: folder.id })
    res.json({ folder })
  } catch (err) {
    console.error('[DELETE /folders/:id/permanent] Failed:', err)
    res.status(500).json({ error: 'Failed to delete folder permanently' })
  }
})

// 📂 Get folders by parentId or all root-level folders
router.get('/', authenticateToken, async (req, res) => {
  let { parentId } = req.query

  console.log('Folder Query:', {
    rawParentId: req.query.parentId,
    parentId,
    userId: req.user.id
  })

  // Normalize 'null' or empty string to real null
  if (parentId === 'null' || parentId === '') parentId = null

  console.log('Normalized Query:', {
    parentId,
    conditions: {
      ownerId: req.user.id,
      deletedAt: null,
      parentId: parentId
    }
  })

  const folders = await prisma.folder.findMany({
    where: {
      ownerId: req.user.id,
      deletedAt: null,
      parentId: parentId
    },
    include: {
      children: true,
      files: true
    },
    orderBy: { createdAt: 'asc' }
  })

  console.log('Query Result:', {
    folderCount: folders.length,
    folders: folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId }))
  })

  res.json({ folders })
})

// ➕ Create a new folder (supports optional metadata)
router.post('/', authenticateToken, async (req, res) => {
  const { name, parentId, metadata } = req.body
  const io = req.app.get('io')
  
  try {
    // Check for existing folder with same name in the same parent folder
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId === 'root' ? null : parentId,
        ownerId: req.user.id,
        deletedAt: null
      }
    });

    if (existingFolder) {
      return res.status(400).json({ 
        error: 'A folder with this name already exists in this location' 
      });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId === 'root' ? null : parentId,
        ownerId: req.user.id,
        metadata: metadata || undefined
      }
    })
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      folderId: folder.id,
      action: 'create-folder',
      message: `${req.user.name} created folder "${name}"`,
      io
    })
    
    // Emit folder update event to all clients in the parent folder or root
    const roomId = parentId === 'root' || !parentId ? 'folder:root' : `folder:${parentId}`
    io.to(roomId).emit('folder:created', folder)
    
    res.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    res.status(500).json({ error: 'Failed to create folder' })
  }
})

// ✏️ Update folder name or metadata
router.patch('/:id', authenticateToken, validate({
  body: z.object({
    name: z.string().optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })
}), async (req, res) => {
  try {
    const folder = await folderService.updateFolder(req.params.id, req.body)
    res.json({ folder })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 🗑 Soft delete a folder
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.folder.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Soft delete failed:', err)
    res.status(500).json({ error: 'Failed to delete folder' })
  }
})

// 🧺 Get soft-deleted folders
router.get('/deleted', authenticateToken, async (req, res) => {
  const where = req.user.isAdmin
    ? { deletedAt: { not: null } }
    : { deletedAt: { not: null }, ownerId: req.user.id }

  const folders = await prisma.folder.findMany({
    where,
    orderBy: { updatedAt: 'desc' }
  })

  res.json({ folders })
})

// 🧨 Permanently delete a folder
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  await prisma.folder.delete({
    where: { id: req.params.id }
  })
  res.json({ success: true })
})

// 📄 Get a single folder by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { folder, stats } = await folderService.getFolderDetails(req.params.id)
    res.json({ folder, stats })
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
})

// 📂 Get folder path information
router.get('/path/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            parentId: true
          }
        }
      }
    })

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    // Build path array
    const path = []
    let current = folder

    while (current) {
      path.unshift({
        id: current.id,
        name: current.name
      })
      current = current.parent
    }

    res.json({ path })
  } catch (err) {
    console.error('[GET /folders/path/:id] Failed:', err)
    res.status(500).json({ error: 'Failed to get folder path' })
  }
})

// 🔍 List all user folders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.query
    const where = {
      ownerId: req.user.id,
      deletedAt: null
    }

    // If parentId is provided, only show folders in that parent
    if (parentId && parentId !== 'null') {
      where.parentId = parentId
    } else if (parentId === 'null' || parentId === '') {
      // If parentId is explicitly null or empty, show only root folders
      where.parentId = null
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
    res.json({ folders })
  } catch (err) {
    console.error('[GET /folders] Failed:', err)
    res.status(500).json({ error: 'Failed to retrieve folders' })
  }
})

// ⭐ Star/unstar a folder
router.post('/:id/star', authenticateToken, async (req, res) => {
  const { id } = req.params
  const io = req.app.get('io')

  try {
    const folder = await prisma.folder.findUnique({
      where: { id }
    })

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        isStarred: !folder.isStarred,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await logActivity({
      userId: req.user.id,
      folderId: id,
      action: 'star-folder',
      message: `${req.user.name} ${updated.isStarred ? 'starred' : 'unstarred'} folder "${folder.name}"`,
      io
    })

    // Emit folder update event
    io.emit('folder:starred', {
      folderId: id,
      isStarred: updated.isStarred
    })

    res.json({ folder: updated })
  } catch (error) {
    console.error('Error starring folder:', error)
    res.status(500).json({ error: 'Failed to star folder' })
  }
})

// Update tags
router.post('/:id/tags', authenticateToken, validate({
  body: z.object({
    tags: z.array(z.string())
  })
}), async (req, res) => {
  try {
    const folder = await folderService.updateTags(req.params.id, req.body.tags)
    res.json({ folder })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get recent folders
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: req.user.id,
        lastAccessedAt: {
          not: null
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
      take: 10 // Limit to 10 most recent folders
    })

    res.json({ folders })
  } catch (error) {
    console.error('Error fetching recent folders:', error)
    res.status(500).json({ error: 'Failed to fetch recent folders' })
  }
})

// Get starred folders
router.get('/starred', authenticateToken, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: req.user.id,
        isStarred: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    res.json({ folders })
  } catch (error) {
    console.error('Error fetching starred folders:', error)
    res.status(500).json({ error: 'Failed to fetch starred folders' })
  }
})

// Get shared folders
router.get('/shared', authenticateToken, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: {
        sharedWith: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    res.json({ folders })
  } catch (error) {
    console.error('Error fetching shared folders:', error)
    res.status(500).json({ error: 'Failed to fetch shared folders' })
  }
})

// 🗑️ Empty trash
router.post('/empty-trash', authenticateToken, async (req, res) => {
  try {
    const deletedFolders = await prisma.folder.deleteMany({
      where: {
        ownerId: req.user.id,
        deletedAt: { not: null }
      }
    })

    await logActivity(req.user.id, 'trash_emptied', { 
      type: 'folders',
      count: deletedFolders.count 
    })

    res.json({ 
      message: 'Trash emptied successfully',
      count: deletedFolders.count 
    })
  } catch (err) {
    console.error('[POST /folders/empty-trash] Failed:', err)
    res.status(500).json({ error: 'Failed to empty trash' })
  }
})

// 🔄 Move folder to a new parent folder
router.patch('/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params
  const { destinationFolderId } = req.body
  const io = req.app.get('io')

  try {
    // Check if destination folder exists (if not moving to root)
    if (destinationFolderId && destinationFolderId !== 'root') {
      const destFolder = await prisma.folder.findUnique({
        where: { id: destinationFolderId }
      })
      if (!destFolder) {
        return res.status(404).json({ error: 'Destination folder not found' })
      }

      // Prevent moving folder into itself or its descendants
      const isDescendant = await checkIfDescendant(id, destinationFolderId)
      if (isDescendant) {
        return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' })
      }
    }

    // Get the folder to be moved
    const folderToMove = await prisma.folder.findUnique({
      where: { id }
    })

    if (!folderToMove) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    // Generate unique name if needed
    const uniqueName = await generateUniqueName(
      folderToMove.name,
      async (name) => {
        const existing = await prisma.folder.findFirst({
          where: {
            parentId: destinationFolderId === 'root' ? null : destinationFolderId,
            name: name,
            id: { not: id },
            deletedAt: null
          }
        })
        return !!existing
      }
    )

    // Move the folder with potentially renamed name
    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name: uniqueName,
        parentId: destinationFolderId === 'root' ? null : destinationFolderId,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await logActivity({
      userId: req.user.id,
      folderId: folder.id,
      action: 'move-folder',
      message: `${req.user.name} moved folder "${folder.name}"${uniqueName !== folderToMove.name ? ' (renamed to avoid conflict)' : ''}`,
      io
    })

    // Emit folder update event
    io.emit('folder:moved', {
      folderId: id,
      destinationFolderId: destinationFolderId === 'root' ? null : destinationFolderId,
      newName: uniqueName
    })

    res.json({ folder })
  } catch (error) {
    console.error('Error moving folder:', error)
    res.status(500).json({ error: 'Failed to move folder' })
  }
})

// Helper function to check if a folder is a descendant of another folder
async function checkIfDescendant(sourceId, targetId) {
  let currentId = targetId
  while (currentId) {
    if (currentId === sourceId) {
      return true
    }
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    })
    currentId = folder?.parentId
  }
  return false
}

// Get folder statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const folderId = req.params.id

    // Verify folder exists and user has access
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        OR: [
          { ownerId: req.user.id },
          { sharedWith: { some: { userId: req.user.id } } }
        ]
      }
    })

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    // Get total size of all files in folder
    const totalSize = await prisma.file.aggregate({
      where: { folderId },
      _sum: { size: true }
    })

    // Get file count by type
    const fileTypes = await prisma.file.groupBy({
      by: ['type'],
      where: { folderId },
      _count: { type: true }
    })

    // Get last modified date
    const lastModified = await prisma.file.findFirst({
      where: { folderId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    res.json({
      totalSize: totalSize._sum.size || 0,
      fileTypes,
      lastModified: lastModified?.updatedAt || null
    })
  } catch (error) {
    console.error('Error fetching folder statistics:', error)
    res.status(500).json({ error: 'Failed to fetch folder statistics' })
  }
})

export default router
