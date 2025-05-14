/* global process */
import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import jwt from 'jsonwebtoken'

export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      logger.warn('No token provided')
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        avatarUrl: true,
      },
    })

    if (!user) {
      logger.warn('User not found for token:', decoded.id)
      return res.status(401).json({ message: 'User not found' })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    logger.error('Auth error:', error)
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    logger.warn('Admin access denied for user:', req.user?.id)
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Middleware to check if user has required role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Role access denied for user:', req.user.id)
      return res.status(403).json({ message: 'Insufficient permissions' })
    }

    next()
  }
}
