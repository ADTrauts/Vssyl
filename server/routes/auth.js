import express from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 🔐 Register
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    logger.warn('Signup missing fields:', { email: !!email, password: !!password, name: !!name })
    return res.status(400).json({ message: 'Missing fields' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      logger.warn('Signup attempt with existing email:', email)
      return res.status(400).json({ message: 'Email already in use' })
    }

    const hashed = await bcrypt.hash(password, 10)

    logger.debug('Creating user with data:', { email, name })
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        updatedAt: new Date()
      }
    })

    logger.info('User registered successfully:', user.id)
    
    // Return user data without password
    res.json({ user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    logger.error('Error in signup:', error.message, error.stack)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// 🔐 Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    logger.warn('Login missing fields:', { email: !!email, password: !!password })
    return res.status(400).json({ message: 'Missing fields' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logger.warn('Login attempt with non-existent email:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      logger.warn('Login attempt with invalid password for email:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, isAdmin: user.isAdmin },
      process.env.NEXTAUTH_SECRET,
      { 
        algorithm: 'HS256',
        expiresIn: '30d'
      }
    )

    // Return user data and token (do NOT set NextAuth cookie)
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      },
      token
    })

    logger.info('User logged in successfully:', user.id)
  } catch (error) {
    logger.error('Error in login:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// 🔐 Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// 🔐 Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        avatarUrl: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    logger.error('Error getting current user:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
