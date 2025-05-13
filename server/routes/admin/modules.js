import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../../middleware/auth.js';
import { validateModule } from '../../modules/runtime/module-loader.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all modules
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        developer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: {
        developer: {
          select: {
            name: true,
            email: true,
          },
        },
        securityReport: true,
        manifest: true,
      },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve module
router.post('/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: { manifest: true },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Validate module
    try {
      await validateModule(module.manifest);
    } catch (error) {
      return res.status(400).json({ error: `Module validation failed: ${error.message}` });
    }

    // Update module status
    await prisma.module.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
    });

    // TODO: Notify developer
    // TODO: Add to marketplace
    // TODO: Update module registry

    res.json({ message: 'Module approved successfully' });
  } catch (error) {
    console.error('Error approving module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject module
router.post('/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Update module status
    await prisma.module.update({
      where: { id: req.params.id },
      data: { status: 'rejected' },
    });

    // TODO: Notify developer
    // TODO: Send rejection reason

    res.json({ message: 'Module rejected successfully' });
  } catch (error) {
    console.error('Error rejecting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete module
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const module = await prisma.module.findUnique({
      where: { id: req.params.id },
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete module
    await prisma.module.delete({
      where: { id: req.params.id },
    });

    // TODO: Remove from marketplace
    // TODO: Notify developer

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 