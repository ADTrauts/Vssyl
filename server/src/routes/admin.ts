import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { userNumberService } from '../services/userNumberService';

const router: express.Router = express.Router();

// Middleware to require admin role
const requireAdmin = (req: Request, res: Response, next: () => void) => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users with their Block IDs
router.get('/users/block-ids', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userNumber: true,
        country: { select: { name: true } },
        region: { select: { name: true } },
        town: { select: { name: true } },
        locationDetectedAt: true,
        locationUpdatedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users with Block IDs:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user location (admin only)
router.put('/users/:userId/location', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { countryId, regionId, townId } = req.body;
    const adminUser = req.user;

    if (!countryId || !regionId || !townId) {
      return res.status(400).json({ error: 'Country, region, and town IDs are required' });
    }

    // Get current user location
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        country: true,
        region: true,
        town: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate location data
    const [country, region, town] = await Promise.all([
      prisma.country.findUnique({ where: { id: countryId } }),
      prisma.region.findUnique({ where: { id: regionId } }),
      prisma.town.findUnique({ where: { id: townId } })
    ]);

    if (!country || !region || !town) {
      return res.status(400).json({ error: 'Invalid location data' });
    }

    // Generate new Block ID
    const locationData = {
      country: country.name,
      countryCode: country.phoneCode,
      region: region.name,
      regionCode: region.code,
      city: town.name,
      cityCode: town.code
    };

    const newUserNumberData = await userNumberService.generateUserNumber(locationData);

    // Update user location and Block ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        countryId,
        regionId,
        townId,
        userNumber: newUserNumberData.userNumber,
        locationUpdatedAt: new Date()
      },
      include: {
        country: true,
        region: true,
        town: true
      }
    });

    // Log the location change
    const oldLocation = currentUser.country?.name && currentUser.region?.name && currentUser.town?.name
      ? `${currentUser.country.name}, ${currentUser.region.name}, ${currentUser.town.name}`
      : 'Unknown';
    const newLocation = `${country.name}, ${region.name}, ${town.name}`;

    if (!adminUser) {
      return res.status(500).json({ error: 'Admin user not found' });
    }

    await AuditService.logLocationChange(
      userId,
      oldLocation,
      newLocation,
      adminUser.id
    );

    res.json({
      message: 'User location updated successfully',
      user: updatedUser,
      oldBlockId: currentUser.userNumber,
      newBlockId: newUserNumberData.userNumber
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ error: 'Failed to update user location' });
  }
});

// Get audit logs for a specific user
router.get('/users/:userId/audit-logs', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await AuditService.getUserAuditLogs(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for a specific Block ID
router.get('/block-ids/:blockId/audit-logs', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await AuditService.getBlockIdAuditLogs(
      blockId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching Block ID audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router; 