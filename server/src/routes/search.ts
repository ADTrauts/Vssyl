import express from 'express';
import { globalSearch, getSuggestions } from '../controllers/searchController';

const router: express.Router = express.Router();

// Global search endpoint
router.post('/', globalSearch);

// Search suggestions endpoint
router.get('/suggestions', getSuggestions);

export default router; 