import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../utils/prisma.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/avatars'
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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
        phone: true,
        address: true,
        avatarUrl: true,
        website: true,
        bio: true,
        social: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.patch('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      birthdate,
      phone,
      address,
      website,
      bio,
      twitter,
      linkedin,
      github
    } = req.body

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        return res.status(400).json({ error: 'Email already taken' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        email,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        phone,
        address,
        website,
        bio,
        social: {
          twitter,
          linkedin,
          github
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
        phone: true,
        address: true,
        avatarUrl: true,
        website: true,
        bio: true,
        social: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Delete old avatar if it exists
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    })

    if (user?.avatarUrl) {
      const oldPath = path.join(process.cwd(), user.avatarUrl.replace(/^\//, ''))
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Update user with new avatar URL
    const avatarUrl = '/' + req.file.path.replace(/\\/g, '/')
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { avatarUrl: true }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Error uploading avatar:', error)
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
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

    if (user.avatarUrl) {
      const avatarPath = path.join('uploads/avatars', path.basename(user.avatarUrl))
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null }
    })

    res.json({ avatarUrl: null })
  } catch (err) {
    console.error('[DELETE /me/avatar] Failed:', err)
    res.status(500).json({ error: 'Failed to delete avatar' })
  }
})

export default router 