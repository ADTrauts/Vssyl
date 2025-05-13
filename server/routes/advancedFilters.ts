import express from 'express';
import { authenticate } from '../middleware/auth';
import { advancedFilterLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { AdvancedFilterService } from '../services/advancedFilterService';

const router = express.Router();
const advancedFilterService = new AdvancedFilterService();

// Create a new advanced filter
router.post('/', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    const filter = await advancedFilterService.createFilter({
      ...req.body,
      createdBy: req.user.id
    });
    res.json(filter);
  } catch (error) {
    logger.error('Error creating advanced filter:', error);
    res.status(500).json({ error: 'Failed to create advanced filter' });
  }
});

// Get a specific filter
router.get('/:filterId', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    const filter = await advancedFilterService.getFilter(req.params.filterId);
    if (!filter) {
      return res.status(404).json({ error: 'Filter not found' });
    }
    res.json(filter);
  } catch (error) {
    logger.error('Error getting advanced filter:', error);
    res.status(500).json({ error: 'Failed to get advanced filter' });
  }
});

// Get all filters for the current user
router.get('/', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    const filters = await advancedFilterService.getUserFilters(req.user.id);
    res.json(filters);
  } catch (error) {
    logger.error('Error getting user filters:', error);
    res.status(500).json({ error: 'Failed to get user filters' });
  }
});

// Update a filter
router.put('/:filterId', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    const filter = await advancedFilterService.updateFilter(req.params.filterId, req.body);
    res.json(filter);
  } catch (error) {
    logger.error('Error updating advanced filter:', error);
    res.status(500).json({ error: 'Failed to update advanced filter' });
  }
});

// Delete a filter
router.delete('/:filterId', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    await advancedFilterService.deleteFilter(req.params.filterId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting advanced filter:', error);
    res.status(500).json({ error: 'Failed to delete advanced filter' });
  }
});

// Apply a filter to data
router.post('/:filterId/apply', authenticate, advancedFilterLimiter, async (req, res) => {
  try {
    const filteredData = await advancedFilterService.applyFilter(req.params.filterId, req.body.data);
    res.json(filteredData);
  } catch (error) {
    logger.error('Error applying advanced filter:', error);
    res.status(500).json({ error: 'Failed to apply advanced filter' });
  }
});

export default router; 