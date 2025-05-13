import express from 'express';
import { SearchService } from '../services/searchService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../prismaClient';

const router = express.Router();
const searchService = new SearchService(prisma);

// Search
router.post('/', authenticate, async (req, res) => {
  try {
    const { query, filters } = req.body;
    const results = await searchService.search(query, filters, req.user.id);
    res.json(results);
  } catch (error) {
    logger.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Search History
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit } = req.query;
    const history = await searchService.getSearchHistory(
      req.user.id,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(history);
  } catch (error) {
    logger.error('Error getting search history:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
});

router.delete('/history', authenticate, async (req, res) => {
  try {
    await searchService.clearSearchHistory(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing search history:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

router.delete('/history/:id', authenticate, async (req, res) => {
  try {
    await searchService.deleteSearchHistoryEntry(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting search history entry:', error);
    res.status(500).json({ error: 'Failed to delete search history entry' });
  }
});

router.patch('/history/:id', authenticate, async (req, res) => {
  try {
    const { query, filters, results } = req.body;
    await searchService.updateSearchHistoryEntry(req.user.id, req.params.id, {
      query,
      filters,
      results
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating search history entry:', error);
    res.status(500).json({ error: 'Failed to update search history entry' });
  }
});

// Saved Searches
router.post('/saved', authenticate, async (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const savedSearch = await searchService.saveSearch(req.user.id, name, query, filters);
    res.json(savedSearch);
  } catch (error) {
    logger.error('Error saving search:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

router.get('/saved', authenticate, async (req, res) => {
  try {
    const savedSearches = await searchService.getSavedSearches(req.user.id);
    res.json(savedSearches);
  } catch (error) {
    logger.error('Error getting saved searches:', error);
    res.status(500).json({ error: 'Failed to get saved searches' });
  }
});

router.get('/saved/:id', authenticate, async (req, res) => {
  try {
    const savedSearch = await searchService.getSavedSearch(req.user.id, req.params.id);
    if (!savedSearch) {
      return res.status(404).json({ error: 'Saved search not found' });
    }
    res.json(savedSearch);
  } catch (error) {
    logger.error('Error getting saved search:', error);
    res.status(500).json({ error: 'Failed to get saved search' });
  }
});

router.patch('/saved/:id', authenticate, async (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const savedSearch = await searchService.updateSavedSearch(req.user.id, req.params.id, {
      name,
      query,
      filters
    });
    res.json(savedSearch);
  } catch (error) {
    logger.error('Error updating saved search:', error);
    res.status(500).json({ error: 'Failed to update saved search' });
  }
});

router.delete('/saved/:id', authenticate, async (req, res) => {
  try {
    await searchService.deleteSavedSearch(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting saved search:', error);
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
});

router.delete('/saved', authenticate, async (req, res) => {
  try {
    await searchService.clearSavedSearches(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing saved searches:', error);
    res.status(500).json({ error: 'Failed to clear saved searches' });
  }
});

// Search Analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const analytics = await searchService.getSearchAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting search analytics:', error);
    res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

router.delete('/analytics', authenticate, async (req, res) => {
  try {
    await searchService.clearSearchAnalytics(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing search analytics:', error);
    res.status(500).json({ error: 'Failed to clear search analytics' });
  }
});

export default router; 