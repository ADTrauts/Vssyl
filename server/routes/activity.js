import express from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/activity?folderId=... or ?fileId=...
router.get('/', authenticateToken, async (req, res) => {
  const { folderId, fileId } = req.query

const filters = []
if (folderId) filters.push({ folderId })
if (fileId) filters.push({ fileId })

const logs = await prisma.activityLog.findMany({
  where: {
    OR: filters.length > 0 ? filters : undefined
  },
  include: {
    user: { select: { id: true, name: true } }
  },
  orderBy: { createdAt: 'desc' }
})

  res.json({ logs })
})

// GET /api/activity/all — Admin only
router.get('/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied' })
  }

  const activity = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // 🔹 limit to recent 100
    include: {
      user: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true } },
      file: { select: { id: true, name: true } }
    }
  })

  res.json({ activity })
})

export default router
