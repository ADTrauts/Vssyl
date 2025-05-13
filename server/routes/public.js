import express from 'express'
import { prisma } from '../utils/prisma.js'
import { nanoid } from 'nanoid'
import path from 'path'
import fs from 'fs'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get public folder info
router.get('/folder/:id', async (req, res) => {
  const { id } = req.params
  
  try {
    // Check if folder exists and is public
    const folder = await prisma.folder.findUnique({
      where: { 
        id,
        isPublic: true
      }
    })
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or not public' })
    }
    
    // Get the owner info
    const owner = await prisma.user.findUnique({
      where: { id: folder.ownerId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    res.json({
      id: folder.id,
      name: folder.name,
      owner: owner,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    })
    
  } catch (error) {
    console.error('Error getting public folder:', error)
    res.status(500).json({ error: 'Failed to get folder information' })
  }
})

// Get files in public folder
router.get('/folder/:id/files', async (req, res) => {
  const { id } = req.params
  
  try {
    // Check if folder exists and is public
    const folder = await prisma.folder.findUnique({
      where: { 
        id,
        isPublic: true
      }
    })
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or not public' })
    }
    
    // Get files in the folder
    const files = await prisma.file.findMany({
      where: {
        parentId: id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        url: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    res.json(files)
    
  } catch (error) {
    console.error('Error getting files from public folder:', error)
    res.status(500).json({ error: 'Failed to get folder contents' })
  }
})

// Get subfolders in public folder
router.get('/folder/:id/folders', async (req, res) => {
  const { id } = req.params
  
  try {
    // Check if folder exists and is public
    const folder = await prisma.folder.findUnique({
      where: { 
        id,
        isPublic: true
      }
    })
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or not public' })
    }
    
    // Get subfolders in the folder
    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    res.json(subfolders)
    
  } catch (error) {
    console.error('Error getting subfolders from public folder:', error)
    res.status(500).json({ error: 'Failed to get folder contents' })
  }
})

// Get a public file or folder by share ID (public route)
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params
    
    // Find the share link
    const share = await prisma.shareLink.findUnique({
      where: { id: shareId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!share) {
      return res.status(404).json({ error: 'Share link not found' })
    }
    
    // Check if it's a file or folder
    if (share.fileId) {
      // It's a file
      const file = await prisma.file.findUnique({
        where: { id: share.fileId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' })
      }
      
      // Extract the current version
      const currentVersion = file.versions[0] || null
      
      return res.json({
        type: 'file',
        data: {
          ...file,
          currentVersion
        },
        share
      })
    } else if (share.folderId) {
      // It's a folder
      const folder = await prisma.folder.findUnique({
        where: { id: share.folderId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          files: {
            where: { deletedAt: null },
            include: {
              versions: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          },
          children: {
            where: { deletedAt: null }
          }
        }
      })
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' })
      }
      
      return res.json({
        type: 'folder',
        data: {
          ...folder,
          children: folder.files,
          childFolders: folder.children
        },
        share
      })
    } else {
      return res.status(400).json({ error: 'Invalid share link' })
    }
  } catch (error) {
    console.error('Error in public share route:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Download a shared file (public route)
router.get('/download/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params
    
    // Find the share link
    const share = await prisma.shareLink.findUnique({
      where: { id: shareId }
    })
    
    if (!share || !share.fileId) {
      return res.status(404).json({ error: 'Shared file not found' })
    }
    
    // Get the file
    const file = await prisma.file.findUnique({
      where: { id: share.fileId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    
    if (!file || !file.versions.length) {
      return res.status(404).json({ error: 'File or file version not found' })
    }
    
    const version = file.versions[0]
    const filePath = version.filePath
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' })
    }
    
    // Stream the file
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
    
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error in download shared file route:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Preview a shared file (for images and PDFs) (public route)
router.get('/preview/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params
    
    // Find the share link
    const share = await prisma.shareLink.findUnique({
      where: { id: shareId }
    })
    
    if (!share || !share.fileId) {
      return res.status(404).json({ error: 'Shared file not found' })
    }
    
    // Get the file
    const file = await prisma.file.findUnique({
      where: { id: share.fileId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    
    if (!file || !file.versions.length) {
      return res.status(404).json({ error: 'File or file version not found' })
    }
    
    const version = file.versions[0]
    const filePath = version.filePath
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' })
    }
    
    // Check if it's an image or PDF
    const mimeType = file.mimeType || ''
    const isImage = mimeType.startsWith('image/')
    const isPDF = mimeType === 'application/pdf'
    
    if (!isImage && !isPDF) {
      return res.status(400).json({ error: 'File type not supported for preview' })
    }
    
    // Set proper content type
    res.setHeader('Content-Type', file.mimeType)
    
    // Stream the file without attachment disposition
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error in preview shared file route:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Create share link (protected route)
router.post('/create-share-link', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.body
    
    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' })
    }
    
    if (type !== 'file' && type !== 'folder') {
      return res.status(400).json({ error: 'Type must be "file" or "folder"' })
    }
    
    // Check if the item exists
    if (type === 'file') {
      const file = await prisma.file.findUnique({
        where: { id }
      })
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' })
      }
      
      // Generate share link
      const shareId = nanoid(10)
      const shareLink = await prisma.shareLink.create({
        data: {
          id: shareId,
          fileId: id,
          ownerId: req.user.id
        }
      })
      
      return res.json({
        shareId: shareLink.id,
        url: `${process.env.FRONTEND_URL}/s/${shareLink.id}`
      })
    } else {
      const folder = await prisma.folder.findUnique({
        where: { id }
      })
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' })
      }
      
      // Generate share link
      const shareId = nanoid(10)
      const shareLink = await prisma.shareLink.create({
        data: {
          id: shareId,
          folderId: id,
          ownerId: req.user.id
        }
      })
      
      return res.json({
        shareId: shareLink.id,
        url: `${process.env.FRONTEND_URL}/s/${shareLink.id}`
      })
    }
  } catch (error) {
    console.error('Error creating share link:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Disable sharing (protected route)
router.post('/disable-sharing', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.body
    
    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' })
    }
    
    if (type !== 'file' && type !== 'folder') {
      return res.status(400).json({ error: 'Type must be "file" or "folder"' })
    }
    
    // Delete share links
    if (type === 'file') {
      await prisma.shareLink.deleteMany({
        where: {
          fileId: id,
          ownerId: req.user.id
        }
      })
    } else {
      await prisma.shareLink.deleteMany({
        where: {
          folderId: id,
          ownerId: req.user.id
        }
      })
    }
    
    return res.json({ success: true })
  } catch (error) {
    console.error('Error disabling sharing:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 