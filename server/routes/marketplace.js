const express = require('express');
const router = express.Router();
const { MarketplaceService } = require('../modules/marketplace/marketplace-service');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Initialize marketplace service
const marketplace = new MarketplaceService({
  moduleSystem: {
    timeout: 5000,
    memoryLimit: 128
  },
  monitoring: {
    logLevel: 'info',
    metricsInterval: 60000
  }
});

// Initialize marketplace
marketplace.initialize().catch(console.error);

// Submit a new module
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const submission = await marketplace.submitModule(req.body, req.user.id);
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a module (admin only)
router.post('/:submissionId/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const submission = await marketplace.approveModule(req.params.submissionId, req.user.id);
    res.json(submission);
  } catch (error) {
    console.error('Error approving module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a module (admin only)
router.post('/:submissionId/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const submission = await marketplace.rejectModule(req.params.submissionId, req.user.id, reason);
    res.json(submission);
  } catch (error) {
    console.error('Error rejecting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module details
router.get('/modules/:moduleId', authenticateToken, async (req, res) => {
  try {
    const module = await marketplace.getModuleDetails(req.params.moduleId);
    res.json(module);
  } catch (error) {
    console.error('Error getting module details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search modules
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q: query } = req.query;
    const modules = await marketplace.searchModules(query);
    res.json(modules);
  } catch (error) {
    console.error('Error searching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get developer's modules
router.get('/developer/modules', authenticateToken, async (req, res) => {
  try {
    const modules = await marketplace.getDeveloperModules(req.user.id);
    res.json(modules);
  } catch (error) {
    console.error('Error getting developer modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update module
router.put('/modules/:moduleId', authenticateToken, async (req, res) => {
  try {
    const module = await marketplace.updateModule(req.params.moduleId, req.body);
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete module
router.delete('/modules/:moduleId', authenticateToken, async (req, res) => {
  try {
    await marketplace.deleteModule(req.params.moduleId);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending submissions (admin only)
router.get('/submissions/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const submissions = await marketplace.prisma.moduleSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        developer: true
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get module statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await marketplace.prisma.moduleSubmission.groupBy({
      by: ['status'],
      _count: true
    });

    const totalModules = stats.reduce((acc, curr) => acc + curr._count, 0);
    const approvedModules = stats.find(s => s.status === 'APPROVED')?._count || 0;
    const pendingModules = stats.find(s => s.status === 'PENDING')?._count || 0;
    const rejectedModules = stats.find(s => s.status === 'REJECTED')?._count || 0;

    res.json({
      totalModules,
      approvedModules,
      pendingModules,
      rejectedModules,
      approvalRate: totalModules > 0 ? (approvedModules / totalModules) * 100 : 0
    });
  } catch (error) {
    console.error('Error getting module statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 