import express from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { logActivity } from '../utils/logActivity.js'

const router = express.Router()

// 🔄 Share folder or file with userEmail or userId + access level
router.post('/share', authenticateToken, async (req, res) => {
  const { userEmail, userId, folderId, fileId, access } = req.body
  const io = req.app.get('io')

  if ((!userEmail && !userId) || (!folderId && !fileId) || !access) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  let targetUser = null

  if (userEmail) {
    targetUser = await prisma.user.findUnique({ where: { email: userEmail } })
  } else {
    targetUser = await prisma.user.findUnique({ where: { id: userId } })
  }

  if (!targetUser) return res.status(404).json({ error: 'User not found' })
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot share with yourself' })
  }

  const isOwner = await prisma.accessControl.findFirst({
    where: {
      userId: req.user.id,
      access: 'OWNER',
      folderId: folderId || undefined,
      fileId: fileId || undefined
    }
  })

  if (!isOwner) {
    return res.status(403).json({ error: 'Only owners can share' })
  }

  const share = await prisma.accessControl.upsert({
    where: {
      userId_folderId_fileId: {
        userId: targetUser.id,
        folderId: folderId || undefined,
        fileId: fileId || undefined
      }
    },
    update: { access },
    create: {
      userId: targetUser.id,
      folderId,
      fileId,
      access
    }
  })

  const room = folderId ? `folder:${folderId}` : `file:${fileId}`
  io.to(room).emit('access:updated', {
    type: folderId ? 'folder' : 'file',
    id: folderId || fileId,
    action: 'shared',
    userId: targetUser.id,
    access
  })

  await logActivity({
    userId: req.user.id,
    folderId,
    fileId,
    action: 'share',
    message: `${req.user.name} shared with ${targetUser.email} (${access})`,
    io
  })

  res.json({ share })
})

// ❌ Unshare user from folder or file
router.delete('/unshare', authenticateToken, async (req, res) => {
  const { userId, folderId, fileId } = req.body
  const io = req.app.get('io')

  if (!userId || (!folderId && !fileId)) {
    return res.status(400).json({ error: 'Missing userId, folderId or fileId' })
  }

  const isOwner = await prisma.accessControl.findFirst({
    where: {
      userId: req.user.id,
      access: 'OWNER',
      folderId: folderId || undefined,
      fileId: fileId || undefined
    }
  })

  if (!isOwner) {
    return res.status(403).json({ error: 'Only owners can unshare' })
  }

  await prisma.accessControl.deleteMany({
    where: {
      userId,
      folderId: folderId || undefined,
      fileId: fileId || undefined
    }
  })

  const room = folderId ? `folder:${folderId}` : `file:${fileId}`
  io.to(room).emit('access:updated', {
    type: folderId ? 'folder' : 'file',
    id: folderId || fileId,
    action: 'unshared',
    userId
  })

  await logActivity({
    userId: req.user.id,
    folderId,
    fileId,
    action: 'unshare',
    message: `${req.user.name} removed a shared user`,
    io
  })

  res.json({ success: true })
})

// 🔍 List shared users for folder or file
router.get('/shared-users', authenticateToken, async (req, res) => {
  const { folderId, fileId } = req.query

  if (!folderId && !fileId) {
    return res.status(400).json({ error: 'Missing folderId or fileId' })
  }

  const shares = await prisma.accessControl.findMany({
    where: {
      folderId: folderId || undefined,
      fileId: fileId || undefined
    },
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
  })

  const users = shares.map(s => ({
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    avatarUrl: s.user.avatarUrl,
    permission: s.access
  }))

  res.json({ users })
})

// 🛡 Admin-only: View all shares system-wide
router.get('/all-shares', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const shares = await prisma.accessControl.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true } },
      file: { select: { id: true, name: true } }
    }
  })

  res.json({ shares })
})

// 🛠 Admin removes a share manually
router.delete('/admin-remove', authenticateToken, async (req, res) => {
  const { userId, folderId, fileId } = req.body
  const io = req.app.get('io')

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  await prisma.accessControl.deleteMany({
    where: {
      userId,
      folderId: folderId || undefined,
      fileId: fileId || undefined
    }
  })

  await logActivity({
    userId: req.user.id,
    folderId,
    fileId,
    action: 'admin-unshare',
    message: `An admin removed a shared user`,
    io
  })

  res.json({ success: true })
})

// 🔐 Admin takeover access
router.post('/admin-takeover', authenticateToken, async (req, res) => {
  const { folderId, fileId } = req.body
  const io = req.app.get('io')

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can take over' })
  }

  if (!folderId && !fileId) {
    return res.status(400).json({ error: 'Missing folderId or fileId' })
  }

  const existing = await prisma.accessControl.findFirst({
    where: {
      userId: req.user.id,
      folderId: folderId || undefined,
      fileId: fileId || undefined
    }
  })

  if (existing) {
    await prisma.accessControl.update({
      where: {
        userId_folderId_fileId: {
          userId: req.user.id,
          folderId: folderId || undefined,
          fileId: fileId || undefined
        }
      },
      data: { access: 'OWNER' }
    })
  } else {
    await prisma.accessControl.create({
      data: {
        userId: req.user.id,
        folderId,
        fileId,
        access: 'OWNER'
      }
    })
  }

  await logActivity({
    userId: req.user.id,
    folderId,
    fileId,
    action: 'takeover',
    message: `${req.user.name} took over this ${folderId ? 'folder' : 'file'} as OWNER`,
    io
  })

  res.json({ success: true })
})

export default router
