import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { logController } from '../controllers/logController';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Client log collection endpoint (for frontend logs)
router.post('/client', logController.collectClientLog);

// Admin log viewing endpoints
router.get('/', logController.getLogs);
router.get('/export', logController.exportLogs);
router.get('/analytics', logController.getLogAnalytics);

// Log alert management
router.get('/alerts', logController.getLogAlerts);
router.post('/alerts', logController.createLogAlert);
router.put('/alerts/:id', logController.updateLogAlert);
router.delete('/alerts/:id', logController.deleteLogAlert);

// Log retention and cleanup
router.post('/cleanup', logController.cleanupOldLogs);
router.get('/retention', logController.getRetentionSettings);
router.put('/retention', logController.updateRetentionSettings);

// Real-time log streaming (WebSocket endpoint will be handled separately)
router.get('/stream', logController.getLogStream);

export { router as adminLogsRouter };
