import express from 'express'
import multer from 'multer'
import path from 'path'
import { prisma } from '../utils/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { logActivity } from '../utils/logActivity.js'
import fs from 'fs'
import { fileService } from '../modules/drive/file-service.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import { generateUniqueName } from '../utils/fileUtils.js'

const router = express.Router()

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create date-based subdirectory
    const today = new Date()
    const uploadDir = path.join('uploads', today.getFullYear().toString(), (today.getMonth() + 1).toString())
    
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

// Configure multer upload
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Log incoming file details
    console.log('[Upload] Received file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })
    
    // Accept all files for now - implement specific filtering if needed
    cb(null, true)
  }
})

// Create single and multiple file upload middlewares
const uploadSingle = uploadMiddleware.single('file')
const uploadMultiple = uploadMiddleware.array('files', 10)

// 🔍 List all user files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { folderId } = req.query
    const where = {
      ownerId: req.user.id,
      deletedAt: null
    }

    // If folderId is provided, only show files in that folder
    if (folderId && folderId !== 'null') {
      where.folderId = folderId
    } else if (folderId === 'null' || folderId === '') {
      // If folderId is explicitly null or empty, show only root files
      where.folderId = null
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
    res.json({ files })
  } catch (err) {
    console.error('[GET /files] Failed:', err)
    res.status(500).json({ error: 'Failed to retrieve files' })
  }
})

// 🗑️ List files in trash
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        ownerId: req.user.id,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    })
    res.json({ files })
  } catch (err) {
    console.error('[GET /files/trash] Failed:', err)
    res.status(500).json({ error: 'Failed to retrieve trash files' })
  }
})

// 🔄 Restore a file from trash
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      data: {
        deletedAt: null
      }
    })

    await logActivity(req.user.id, 'file_restored', { fileId: file.id })
    res.json({ file })
  } catch (err) {
    console.error('[POST /files/:id/restore] Failed:', err)
    res.status(500).json({ error: 'Failed to restore file' })
  }
})

// 🗑️ Permanently delete a file
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const file = await prisma.file.delete({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    })

    await logActivity(req.user.id, 'file_deleted_permanently', { fileId: file.id })
    res.json({ file })
  } catch (err) {
    console.error('[DELETE /files/:id/permanent] Failed:', err)
    res.status(500).json({ error: 'Failed to delete file permanently' })
  }
})

// ⬆️ Upload a new file
router.post('/', authenticateToken, (req, res) => {
  uploadSingle(req, res, async (err) => {
    const io = req.app.get('io')
    let { folderId } = req.body

    // Handle multer errors
    if (err instanceof multer.MulterError) {
      console.error('[Upload] Multer error:', err)
      return res.status(400).json({ 
        error: err.code === 'LIMIT_FILE_SIZE' 
          ? 'File is too large. Maximum size is 100MB'
          : 'File upload error: ' + err.message 
      })
    } else if (err) {
      console.error('[Upload] Unknown error:', err)
      return res.status(500).json({ error: 'File upload failed' })
    }

    // Check if file was provided
    if (!req.file) {
      console.warn('[Upload] No file received')
      return res.status(400).json({ error: 'No file uploaded' })
    }

    console.log('[Upload] Processing file:', {
      file: req.file,
      folderId: folderId
    })

    if (folderId === 'null' || folderId === '') folderId = null

    try {
      // Check for duplicate file name
      const existingFile = await prisma.file.findFirst({
        where: {
          name: req.file.originalname,
          folderId: folderId || null,
          ownerId: req.user.id,
          deletedAt: null
        }
      })

      if (existingFile) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path)
        console.warn('[Upload] Duplicate file name:', req.file.originalname)
        return res.status(400).json({ error: 'A file with this name already exists in this folder' })
      }

      // Save file record to database
      const saved = await prisma.file.create({
        data: {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: '/' + req.file.path.replace(/\\/g, '/'),
          folderId,
          ownerId: req.user.id
        }
      })

      console.log('[Upload] File saved successfully:', {
        id: saved.id,
        name: saved.name,
        url: saved.url
      })

      // Log activity
      await logActivity({
        userId: req.user.id,
        folderId,
        fileId: saved.id,
        action: 'upload',
        message: `${req.user.name} uploaded ${req.file.originalname}`,
        io
      })

      res.json({ file: saved })
    } catch (err) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      console.error('[Upload] Database/Activity error:', err)
      res.status(500).json({ error: 'Failed to process uploaded file' })
    }
  })
})

// ✏️ Rename file
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await prisma.file.update({
      where: { id: req.params.id },
      data: { name: req.body.name }
    })
    res.json({ file })
  } catch (err) {
    console.error('[PATCH /files/:id] Rename failed:', err)
    res.status(500).json({ error: 'Failed to rename file' })
  }
})

// 🗑 Soft delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.file.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    })
    res.json({ success: true })
  } catch (err) {
    console.error('[DELETE /files/:id] Soft delete failed:', err)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// ♻️ Get soft-deleted files
router.get('/deleted', authenticateToken, async (req, res) => {
  try {
    const where = req.user.isAdmin
      ? { deletedAt: { not: null } }
      : { deletedAt: { not: null }, ownerId: req.user.id }

    const files = await prisma.file.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    res.json({ files })
  } catch (err) {
    console.error('[GET /files/deleted] Failed:', err)
    res.status(500).json({ error: 'Failed to get deleted files' })
  }
})

// 🔁 Upload a new version
router.post('/:id/version', authenticateToken, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('[Upload Version] Error:', err)
      return res.status(500).json({ error: 'File upload failed' })
    }

    const { id } = req.params
    const io = req.app.get('io')

    try {
      const file = await prisma.file.findUnique({ where: { id } })
      if (!file) return res.status(404).json({ error: 'File not found' })

      await prisma.fileVersion.create({
        data: {
          fileId: file.id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          url: file.url
        }
      })

      const updated = await prisma.file.update({
        where: { id },
        data: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: '/' + req.file.path.replace(/\\/g, '/')
        }
      })

      await logActivity({
        userId: req.user.id,
        fileId: id,
        action: 'upload',
        message: `${req.user.name} uploaded a new version of "${updated.name}"`,
        io
      })

      res.json({ file: updated })
    } catch (err) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      console.error('[POST /files/:id/version] Upload version failed:', err)
      res.status(500).json({ error: 'Failed to upload file version' })
    }
  })
})

// 📜 Get version history
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const versions = await prisma.fileVersion.findMany({
      where: { fileId: req.params.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ versions })
  } catch (err) {
    console.error('[GET /files/:id/versions] Failed:', err)
    res.status(500).json({ error: 'Failed to fetch file versions' })
  }
})

// 🔙 Restore a previous version
router.post('/:id/restore', authenticateToken, async (req, res) => {
  const { versionId } = req.body
  const io = req.app.get('io')

  try {
    const version = await prisma.fileVersion.findUnique({ where: { id: versionId } })
    if (!version) return res.status(404).json({ error: 'Version not found' })

    const restored = await prisma.file.update({
      where: { id: req.params.id },
      data: {
        name: version.name,
        size: version.size,
        mimeType: version.mimeType,
        url: version.url
      }
    })

    await logActivity({
      userId: req.user.id,
      fileId: restored.id,
      action: 'restore',
      message: `${req.user.name} restored a previous version of "${restored.name}"`,
      io
    })

    res.json({ file: restored })
  } catch (err) {
    console.error('[POST /files/:id/restore] Restore failed:', err)
    res.status(500).json({ error: 'Failed to restore file version' })
  }
})

// ✅ Get file by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: {
        owner: true,
        folder: true,
        accessControls: true,
        versions: true
      }
    })

    if (!file) return res.status(404).json({ error: 'File not found' })
    res.json({ file })
  } catch (err) {
    console.error('[GET /files/:id] Failed:', err)
    res.status(500).json({ error: 'Failed to retrieve file' })
  }
})

// ⬆️ Batch upload multiple files
router.post('/upload', authenticateToken, (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.error('[Batch Upload] Error:', err)
      return res.status(500).json({ error: 'File upload failed' })
    }

    const io = req.app.get('io')
    let { folderId } = req.body
    const files = req.files

    console.log('[POST /files/upload] Incoming batch file upload')
    console.log('  ➤ files:', files?.length || 0)
    console.log('  ➤ body.folderId:', folderId)

    if (!files || files.length === 0) {
      console.warn('[POST /files/upload] ❌ No files received in upload.')
      return res.status(400).json({ message: 'No files uploaded' })
    }

    if (folderId === 'null' || folderId === '') folderId = null

    try {
      const savedFiles = []

      // Process each file
      for (const file of files) {
        const saved = await prisma.file.create({
          data: {
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`,
            folderId,
            ownerId: req.user.id
          }
        })

        savedFiles.push(saved)

        await logActivity({
          userId: req.user.id,
          folderId,
          fileId: saved.id,
          action: 'upload',
          message: `${req.user.name} uploaded ${file.originalname}`,
          io
        })
      }

      res.json({ files: savedFiles })
    } catch (err) {
      console.error('[POST /files/upload] ❌ Batch upload failed:', err)
      res.status(500).json({ error: 'Failed to upload files' })
    }
  })
})

// Move file to new folder
router.post('/:id/move', authenticateToken, validate({
  body: z.object({
    folderId: z.string()
  })
}), async (req, res) => {
  try {
    const file = await fileService.moveFile(req.params.id, req.body.folderId)
    res.json({ file })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 🗑️ Empty trash
router.post('/empty-trash', authenticateToken, async (req, res) => {
  try {
    const deletedFiles = await prisma.file.deleteMany({
      where: {
        ownerId: req.user.id,
        deletedAt: { not: null }
      }
    })

    await logActivity(req.user.id, 'trash_emptied', { 
      type: 'files',
      count: deletedFiles.count 
    })

    res.json({ 
      message: 'Trash emptied successfully',
      count: deletedFiles.count 
    })
  } catch (err) {
    console.error('[POST /files/empty-trash] Failed:', err)
    res.status(500).json({ error: 'Failed to empty trash' })
  }
})

// 🔄 Move file to a new folder
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
    }

    // Get the file to be moved
    const fileToMove = await prisma.file.findUnique({
      where: { id }
    })

    if (!fileToMove) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Generate unique name if needed
    const uniqueName = await generateUniqueName(
      fileToMove.name,
      async (name) => {
        const existing = await prisma.file.findFirst({
          where: {
            folderId: destinationFolderId === 'root' ? null : destinationFolderId,
            name: name,
            id: { not: id },
            deletedAt: null
          }
        })
        return !!existing
      }
    )

    // Move the file with potentially renamed name
    const file = await prisma.file.update({
      where: { id },
      data: {
        name: uniqueName,
        folderId: destinationFolderId === 'root' ? null : destinationFolderId,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await logActivity({
      userId: req.user.id,
      fileId: file.id,
      action: 'move-file',
      message: `${req.user.name} moved file "${file.name}"${uniqueName !== fileToMove.name ? ' (renamed to avoid conflict)' : ''}`,
      io
    })

    // Emit file update event
    io.emit('file:moved', {
      fileId: id,
      destinationFolderId: destinationFolderId === 'root' ? null : destinationFolderId,
      newName: uniqueName
    })

    res.json({ file })
  } catch (error) {
    console.error('Error moving file:', error)
    res.status(500).json({ error: 'Failed to move file' })
  }
})

// ⭐ Star/unstar a file
router.post('/:id/star', authenticateToken, async (req, res) => {
  const { id } = req.params
  const io = req.app.get('io')

  try {
    const file = await prisma.file.findUnique({
      where: { id }
    })

    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    const updated = await prisma.file.update({
      where: { id },
      data: {
        isStarred: !file.isStarred,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await logActivity({
      userId: req.user.id,
      fileId: id,
      action: 'star-file',
      message: `${req.user.name} ${updated.isStarred ? 'starred' : 'unstarred'} file "${file.name}"`,
      io
    })

    // Emit file update event
    io.emit('file:starred', {
      fileId: id,
      isStarred: updated.isStarred
    })

    res.json({ file: updated })
  } catch (error) {
    console.error('Error starring file:', error)
    res.status(500).json({ error: 'Failed to star file' })
  }
})

export default router
