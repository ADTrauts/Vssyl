import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcrypt';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

/**
 * One-time / emergency bootstrap routes. Mounted only when ENABLE_ADMIN_SETUP_ROUTES=true
 * and ADMIN_SETUP_SECRET is set (see index.ts). Every request must present the secret.
 */
function requireAdminSetupSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ADMIN_SETUP_SECRET?.trim() ?? '';
  if (expected.length < 16) {
    res.status(503).json({ success: false, error: 'Admin setup is not configured' });
    return;
  }

  const headerVal = req.headers['x-admin-setup-secret'];
  const fromHeader = typeof headerVal === 'string' ? headerVal : Array.isArray(headerVal) ? headerVal[0] : '';
  const fromBody =
    req.body && typeof req.body === 'object' && typeof (req.body as { setupSecret?: string }).setupSecret === 'string'
      ? (req.body as { setupSecret: string }).setupSecret
      : '';
  const provided = fromHeader || fromBody;

  if (!provided) {
    res.status(401).json({ success: false, error: 'Setup secret required (X-Admin-Setup-Secret header or setupSecret in body)' });
    return;
  }

  const hashA = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(expected, 'utf8').digest();
  if (!crypto.timingSafeEqual(hashA, hashB)) {
    void logger.logSecurityEvent('admin_setup_secret_invalid', 'medium', {
      operation: 'admin_setup_auth_failed',
      path: req.path,
      ipAddress: req.ip,
    });
    res.status(403).json({ success: false, error: 'Invalid setup secret' });
    return;
  }

  next();
}

router.use(requireAdminSetupSecret);

// Special endpoint to create Andrew's admin account in production
// This is a one-time setup endpoint that should be removed after use
router.post('/create-andrew-admin', async (req: Request, res: Response) => {
  try {
    logSrvDebug('admin_setup_creating_andrew_admin_user_in_production', '🚀 Creating Andrew admin user in production...');
    
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
      // Create new admin user (password is not returned — use forgot-password / reset flow)
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
        message: 'Admin user created successfully. Set a new password using the normal password reset flow; credentials are not returned in API responses.',
        user: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    }

  } catch (error) {
    logSrvErr('admin_setup_error_creating_admin_user', '❌ Error creating admin user:', error);
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

    logSrvDebug('admin_setup_updating_andrew_admin_password', '🔐 Updating Andrew admin password...');
    
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
    logSrvErr('admin_setup_error_updating_admin_password', '❌ Error updating admin password:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update admin password',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if user exists and promote to admin
router.post('/promote-existing-user', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    logSrvDebug('admin_setup_promote_lookup', 'Looking for existing user', { email });
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (existingUser.role === 'ADMIN') {
      return res.json({
        success: true,
        message: 'User is already an admin',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          createdAt: existingUser.createdAt
        }
      });
    }

    // Promote to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    return res.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    logSrvErr('admin_setup_error_promoting_user', '❌ Error promoting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to promote user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete duplicate admin account
router.delete('/delete-duplicate-admin', async (req: Request, res: Response) => {
  try {
    logSrvDebug('admin_setup_deleting_duplicate_admin_account', '🗑️ Deleting duplicate admin account...');
    
    const deletedUser = await prisma.user.delete({
      where: { email: 'Andrew.Trautman@Vssyl.con' },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    return res.json({
      success: true,
      message: 'Duplicate admin account deleted successfully',
      deletedUser
    });

  } catch (error) {
    logSrvErr('admin_setup_error_deleting_duplicate_admin', '❌ Error deleting duplicate admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete duplicate admin',
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
    logSrvErr('admin_setup_error_fetching_admin_users', '❌ Error fetching admin users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
    });
  }
});

// Get all users (for debugging)
router.get('/all-users', async (req: Request, res: Response) => {
  try {
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      success: true,
      totalUsers: allUsers.length,
      users: allUsers
    });

  } catch (error) {
    logSrvErr('admin_setup_error_fetching_all_users', '❌ Error fetching all users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch all users'
    });
  }
});

export default router;
