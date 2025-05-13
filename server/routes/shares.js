import express from 'express'
import { prisma } from '../utils/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { nanoid } from 'nanoid'
import { logActivity } from '../utils/activity.js'

const router = express.Router()

// Generate a shareable link for a file or folder
router.post('/:type/:id/link', requireAuth, async (req, res) => {
  const { type, id } = req.params
  const { expiresIn, allowsEdit } = req.body // expiresIn in hours, optional
  const io = req.app.get('io')
  
  try {
    // Check if the user has access to share
    let itemToShare
    if (type === 'file') {
      itemToShare = await prisma.file.findUnique({
        where: { id },
        include: { accessControls: true }
      })
    } else if (type === 'folder') {
      itemToShare = await prisma.folder.findUnique({
        where: { id },
        include: { accessControls: true }
      })
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }

    if (!itemToShare) {
      return res.status(404).json({ error: `${type} not found` })
    }
    
    // Check if user is owner or has explicit sharing permission
    const hasAccess = itemToShare.ownerId === req.user.id || 
      itemToShare.accessControls.some(ac => 
        ac.userId === req.user.id && 
        (ac.access === 'OWNER' || ac.access === 'EDIT')
      ) ||
      req.user.role === 'ADMIN'
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to share this item' })
    }
    
    // Calculate expiration date if provided
    let expiresAt = null
    if (expiresIn) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn))
    }
    
    // Create a unique token
    const token = nanoid(12)
    
    // Create the shareable link
    const shareableLink = await prisma.shareableLink.create({
      data: {
        token,
        expiresAt,
        allowsEdit: !!allowsEdit,
        createdById: req.user.id,
        ...(type === 'file' ? { fileId: id } : { folderId: id })
      }
    })
    
    // Generate the full shareable URL (frontend will handle this)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${token}`
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      ...(type === 'file' ? { fileId: id } : { folderId: id }),
      action: 'share-link',
      message: `${req.user.name} created a shareable link for ${type} "${itemToShare.name}"`,
      io
    })
    
    res.json({ link: shareUrl, shareableLink })
    
  } catch (error) {
    console.error('Error creating shareable link:', error)
    res.status(500).json({ error: 'Failed to create shareable link' })
  }
})

// Get shareable link for a file or folder
router.get('/:type/:id/link', requireAuth, async (req, res) => {
  const { type, id } = req.params
  
  try {
    // Find existing shareable link
    const query = type === 'file' 
      ? { fileId: id }
      : { folderId: id }
    
    const existingLink = await prisma.shareableLink.findFirst({
      where: query,
      orderBy: { createdAt: 'desc' }
    })
    
    if (!existingLink) {
      return res.json({ link: '' })
    }
    
    // Check if the link is expired
    if (existingLink.expiresAt && new Date() > existingLink.expiresAt) {
      return res.json({ link: '' })
    }
    
    // Generate the full shareable URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${existingLink.token}`
    
    res.json({ link: shareUrl, linkDetails: existingLink })
    
  } catch (error) {
    console.error('Error getting shareable link:', error)
    res.status(500).json({ error: 'Failed to get shareable link' })
  }
})

// Get users with share access to a file or folder
router.get('/:type/:id/users', requireAuth, async (req, res) => {
  const { type, id } = req.params
  
  try {
    const whereClause = type === 'file' 
      ? { fileId: id }
      : { folderId: id }
    
    const accessControls = await prisma.accessControl.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Transform the data for the frontend
    const users = accessControls.map(ac => ({
      id: ac.user.id,
      name: ac.user.name,
      email: ac.user.email,
      permission: ac.access.toLowerCase()
    }))
    
    res.json(users)
    
  } catch (error) {
    console.error('Error getting shared users:', error)
    res.status(500).json({ error: 'Failed to get shared users' })
  }
})

// Add a user with access to a file or folder
router.post('/:type/:id/user', requireAuth, async (req, res) => {
  const { type, id } = req.params
  const { email, permission } = req.body
  const io = req.app.get('io')
  
  try {
    // Validate input
    if (!email || !permission) {
      return res.status(400).json({ error: 'Email and permission are required' })
    }
    
    // Find the user by email
    const userToShare = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!userToShare) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Prevent sharing with self
    if (userToShare.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot share with yourself' })
    }
    
    // Check if the user has access to share
    let itemToShare, itemName
    if (type === 'file') {
      itemToShare = await prisma.file.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else if (type === 'folder') {
      itemToShare = await prisma.folder.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }
    
    if (!itemToShare) {
      return res.status(404).json({ error: `${type} not found` })
    }
    
    // Check if user is owner or has explicit sharing permission
    const hasAccess = itemToShare.ownerId === req.user.id || 
      itemToShare.accessControls.some(ac => 
        ac.userId === req.user.id && ac.access === 'OWNER'
      ) ||
      req.user.role === 'ADMIN'
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to share this item' })
    }
    
    // Map permission string to AccessLevel enum
    const accessLevel = permission.toUpperCase() === 'VIEWER' ? 'VIEW' : 
                        permission.toUpperCase() === 'EDITOR' ? 'EDIT' : 
                        permission.toUpperCase() === 'OWNER' ? 'OWNER' : 'VIEW'
    
    // Check if share already exists
    const existingShare = await prisma.accessControl.findFirst({
      where: {
        userId: userToShare.id,
        ...(type === 'file' ? { fileId: id } : { folderId: id })
      }
    })
    
    if (existingShare) {
      // Update existing share
      await prisma.accessControl.update({
        where: { id: existingShare.id },
        data: { access: accessLevel }
      })
    } else {
      // Create new share
      await prisma.accessControl.create({
        data: {
          userId: userToShare.id,
          access: accessLevel,
          ...(type === 'file' ? { fileId: id } : { folderId: id })
        }
      })
    }
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      ...(type === 'file' ? { fileId: id } : { folderId: id }),
      action: 'share',
      message: `${req.user.name} shared ${type} "${itemName}" with ${userToShare.name}`,
      io
    })
    
    res.json({ success: true })
    
  } catch (error) {
    console.error('Error sharing with user:', error)
    res.status(500).json({ error: 'Failed to share with user' })
  }
})

// Update a user's permission for a file or folder
router.put('/:type/:id/user/:userId', requireAuth, async (req, res) => {
  const { type, id, userId } = req.params
  const { permission } = req.body
  const io = req.app.get('io')
  
  try {
    // Validate input
    if (!permission) {
      return res.status(400).json({ error: 'Permission is required' })
    }
    
    // Check if the user has access to modify shares
    let itemToShare, itemName
    if (type === 'file') {
      itemToShare = await prisma.file.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else if (type === 'folder') {
      itemToShare = await prisma.folder.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }
    
    if (!itemToShare) {
      return res.status(404).json({ error: `${type} not found` })
    }
    
    // Check if user is owner or has explicit sharing permission
    const hasAccess = itemToShare.ownerId === req.user.id || 
      itemToShare.accessControls.some(ac => 
        ac.userId === req.user.id && ac.access === 'OWNER'
      ) ||
      req.user.role === 'ADMIN'
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to modify sharing' })
    }
    
    // Map permission string to AccessLevel enum
    const accessLevel = permission.toUpperCase() === 'VIEWER' ? 'VIEW' : 
                        permission.toUpperCase() === 'EDITOR' ? 'EDIT' : 
                        permission.toUpperCase() === 'OWNER' ? 'OWNER' : 'VIEW'
    
    // Get the existing share
    const existingShare = await prisma.accessControl.findFirst({
      where: {
        userId,
        ...(type === 'file' ? { fileId: id } : { folderId: id })
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    if (!existingShare) {
      return res.status(404).json({ error: 'Share not found' })
    }
    
    // Update the share
    await prisma.accessControl.update({
      where: { id: existingShare.id },
      data: { access: accessLevel }
    })
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      ...(type === 'file' ? { fileId: id } : { folderId: id }),
      action: 'update-share',
      message: `${req.user.name} updated ${existingShare.user.name}'s permission for ${type} "${itemName}" to ${permission}`,
      io
    })
    
    res.json({ success: true })
    
  } catch (error) {
    console.error('Error updating share permission:', error)
    res.status(500).json({ error: 'Failed to update share permission' })
  }
})

// Remove a user's access to a file or folder
router.delete('/:type/:id/user/:userId', requireAuth, async (req, res) => {
  const { type, id, userId } = req.params
  const io = req.app.get('io')
  
  try {
    // Check if the user has access to modify shares
    let itemToShare, itemName
    if (type === 'file') {
      itemToShare = await prisma.file.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else if (type === 'folder') {
      itemToShare = await prisma.folder.findUnique({
        where: { id },
        include: { accessControls: true }
      })
      itemName = itemToShare?.name
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }
    
    if (!itemToShare) {
      return res.status(404).json({ error: `${type} not found` })
    }
    
    // Check if user is owner or has explicit sharing permission
    const hasAccess = itemToShare.ownerId === req.user.id || 
      itemToShare.accessControls.some(ac => 
        ac.userId === req.user.id && ac.access === 'OWNER'
      ) ||
      req.user.role === 'ADMIN'
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to remove sharing' })
    }
    
    // Get the existing share for logging
    const existingShare = await prisma.accessControl.findFirst({
      where: {
        userId,
        ...(type === 'file' ? { fileId: id } : { folderId: id })
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    if (!existingShare) {
      return res.status(404).json({ error: 'Share not found' })
    }
    
    // Delete the share
    await prisma.accessControl.deleteMany({
      where: {
        userId,
        ...(type === 'file' ? { fileId: id } : { folderId: id })
      }
    })
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      ...(type === 'file' ? { fileId: id } : { folderId: id }),
      action: 'unshare',
      message: `${req.user.name} removed ${existingShare.user.name}'s access to ${type} "${itemName}"`,
      io
    })
    
    res.json({ success: true })
    
  } catch (error) {
    console.error('Error removing share:', error)
    res.status(500).json({ error: 'Failed to remove share' })
  }
})

// Access shared item via token (no auth required)
router.get('/access/:token', async (req, res) => {
  const { token } = req.params
  
  try {
    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { token },
      include: {
        file: true,
        folder: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!shareableLink) {
      return res.status(404).json({ error: 'Link not found or invalid' })
    }
    
    // Check if the link is expired
    if (shareableLink.expiresAt && new Date() > shareableLink.expiresAt) {
      return res.status(403).json({ error: 'This link has expired' })
    }
    
    // Increment access count
    await prisma.shareableLink.update({
      where: { id: shareableLink.id },
      data: { accessCount: { increment: 1 } }
    })
    
    // Determine what was shared
    const sharedItem = shareableLink.file || shareableLink.folder
    if (!sharedItem) {
      return res.status(404).json({ error: 'Shared item not found' })
    }
    
    // Prepare response
    const response = {
      item: {
        id: sharedItem.id,
        name: sharedItem.name,
        type: shareableLink.fileId ? 'file' : 'folder',
        ...(shareableLink.fileId ? {
          mimeType: shareableLink.file.mimeType,
          size: shareableLink.file.size,
          url: shareableLink.file.url
        } : {})
      },
      sharedBy: shareableLink.createdBy,
      allowsEdit: shareableLink.allowsEdit,
      expiresAt: shareableLink.expiresAt
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('Error accessing shared item:', error)
    res.status(500).json({ error: 'Failed to access shared item' })
  }
})

// Set folder visibility (public/private)
router.put('/folder/:id/visibility', requireAuth, async (req, res) => {
  const { id } = req.params
  const { isPublic } = req.body
  const io = req.app.get('io')
  
  try {
    // Check if folder exists and user has permission
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { accessControls: true }
    })
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }
    
    // Check if user is owner or has admin permission
    const hasAccess = folder.ownerId === req.user.id || 
      folder.accessControls.some(ac => 
        ac.userId === req.user.id && ac.access === 'OWNER'
      ) ||
      req.user.role === 'ADMIN'
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to change folder visibility' })
    }
    
    // Update folder visibility
    await prisma.folder.update({
      where: { id },
      data: { isPublic: !!isPublic }
    })
    
    // Log the activity
    await logActivity({
      userId: req.user.id,
      folderId: id,
      action: 'visibility-change',
      message: `${req.user.name} set folder "${folder.name}" to ${isPublic ? 'public' : 'private'}`,
      io
    })
    
    res.json({ success: true, isPublic: !!isPublic })
    
  } catch (error) {
    console.error('Error updating folder visibility:', error)
    res.status(500).json({ error: 'Failed to update folder visibility' })
  }
})

module.exports = router 