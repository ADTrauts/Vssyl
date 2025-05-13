import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../utils/prisma.js'
import { authenticateToken, isAdmin } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/avatars'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'))
    }
  }
})

// Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    logger.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update current user's profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: req.user.id
        }
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    logger.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const avatarUrl = `/avatars/${req.file.filename}`

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    logger.error('Error uploading avatar:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    })

    if (user?.avatarUrl) {
      const filePath = path.join(process.cwd(), 'public', user.avatarUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null }
    })

    res.json({ message: 'Avatar deleted successfully' })
  } catch (error) {
    logger.error('Error deleting avatar:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin routes
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        createdAt: true
      }
    })
    res.json(users)
  } catch (error) {
    logger.error('Error fetching users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
