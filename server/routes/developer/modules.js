const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateDeveloper } = require('../../middleware/auth');
const { validateModule } = require('../../utils/module-validator');

const prisma = new PrismaClient();

// Submit a new module
router.post('/submit', authenticateDeveloper, async (req, res) => {
  try {
    const { name, version, description, isFree, price, permissions, dependencies, code } = req.body;
    const developerId = req.user.id;

    // Validate module code and manifest
    const validationResult = await validateModule({
      name,
      version,
      description,
      permissions,
      dependencies,
      code
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid module',
        details: validationResult.errors
      });
    }

    // Create module submission
    const submission = await prisma.moduleSubmission.create({
      data: {
        name,
        version,
        description,
        isFree,
        price: isFree ? null : price,
        permissions,
        dependencies,
        code,
        status: 'PENDING',
        developerId,
        submittedAt: new Date()
      }
    });

    // TODO: Trigger security scan
    // TODO: Notify admin team
    // TODO: Send confirmation email to developer

    res.status(201).json({
      message: 'Module submitted successfully',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Error submitting module:', error);
    res.status(500).json({
      error: 'Failed to submit module',
      details: error.message
    });
  }
});

// Get developer's modules
router.get('/', authenticateDeveloper, async (req, res) => {
  try {
    const modules = await prisma.moduleSubmission.findMany({
      where: {
        developerId: req.user.id
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      error: 'Failed to fetch modules',
      details: error.message
    });
  }
});

// Get module details
router.get('/:id', authenticateDeveloper, async (req, res) => {
  try {
    const module = await prisma.moduleSubmission.findUnique({
      where: {
        id: req.params.id,
        developerId: req.user.id
      }
    });

    if (!module) {
      return res.status(404).json({
        error: 'Module not found'
      });
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({
      error: 'Failed to fetch module',
      details: error.message
    });
  }
});

// Update module
router.put('/:id', authenticateDeveloper, async (req, res) => {
  try {
    const { name, version, description, isFree, price, permissions, dependencies, code } = req.body;

    // Validate module code and manifest
    const validationResult = await validateModule({
      name,
      version,
      description,
      permissions,
      dependencies,
      code
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid module',
        details: validationResult.errors
      });
    }

    const module = await prisma.moduleSubmission.update({
      where: {
        id: req.params.id,
        developerId: req.user.id,
        status: 'PENDING' // Only allow updates to pending submissions
      },
      data: {
        name,
        version,
        description,
        isFree,
        price: isFree ? null : price,
        permissions,
        dependencies,
        code,
        lastUpdated: new Date()
      }
    });

    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({
      error: 'Failed to update module',
      details: error.message
    });
  }
});

// Delete module
router.delete('/:id', authenticateDeveloper, async (req, res) => {
  try {
    await prisma.moduleSubmission.delete({
      where: {
        id: req.params.id,
        developerId: req.user.id,
        status: 'PENDING' // Only allow deletion of pending submissions
      }
    });

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({
      error: 'Failed to delete module',
      details: error.message
    });
  }
});

module.exports = router; 