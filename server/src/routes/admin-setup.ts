import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcrypt';

const router: express.Router = express.Router();

// Special endpoint to create Andrew's admin account in production
// This is a one-time setup endpoint that should be removed after use
router.post('/create-andrew-admin', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Creating Andrew admin user in production...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'Andrew.Trautman@Vssyl.con' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        return res.json({
          success: true,
          message: 'User is already an admin',
          user: {
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        });
      } else {
        // Promote to admin
        const updatedUser = await prisma.user.update({
          where: { email: 'Andrew.Trautman@Vssyl.con' },
          data: { role: 'ADMIN' },
          select: { id: true, email: true, name: true, role: true }
        });
        
        return res.json({
          success: true,
          message: 'User promoted to admin successfully',
          user: {
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role
          }
        });
      }
    } else {
      // Create new admin user
      const password = 'VssylAdmin2025!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'Andrew.Trautman@Vssyl.con',
          password: hashedPassword,
          name: 'Andrew Trautman',
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        credentials: {
          email: newUser.email,
          password: password
        }
      });
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update admin user password
router.post('/update-andrew-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    console.log('🔐 Updating Andrew admin password...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const updatedUser = await prisma.user.update({
      where: { email: 'Andrew.Trautman@Vssyl.con' },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true, role: true }
    });

    return res.json({
      success: true,
      message: 'Admin password updated successfully',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update admin password',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current admin users
router.get('/admin-users', async (req: Request, res: Response) => {
  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true, role: true, createdAt: true }
    });

    return res.json({
      success: true,
      adminUsers
    });

  } catch (error) {
    console.error('❌ Error fetching admin users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
    });
  }
});

export default router;