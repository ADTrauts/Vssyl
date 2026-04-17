import express from 'express';
import { requireRole } from '../middleware/auth';
import { logController } from '../controllers/logController';

const router: express.Router = express.Router();

// Client log collection (any authenticated user) — parent mount applies `authenticateJWT`
router.post('/client', logController.collectClientLog);

// Admin-only: viewing, export, retention, alerts (parent mount still authenticates JWT)
router.get('/', requireRole('ADMIN'), logController.getLogs);
router.get('/export', requireRole('ADMIN'), logController.exportLogs);
router.get('/analytics', requireRole('ADMIN'), logController.getLogAnalytics);

router.get('/alerts', requireRole('ADMIN'), logController.getLogAlerts);
router.post('/alerts', requireRole('ADMIN'), logController.createLogAlert);
router.put('/alerts/:id', requireRole('ADMIN'), logController.updateLogAlert);
router.delete('/alerts/:id', requireRole('ADMIN'), logController.deleteLogAlert);

router.post('/cleanup', requireRole('ADMIN'), logController.cleanupOldLogs);
router.get('/retention', requireRole('ADMIN'), logController.getRetentionSettings);
router.put('/retention', requireRole('ADMIN'), logController.updateRetentionSettings);

router.get('/stream', requireRole('ADMIN'), logController.getLogStream);

export { router as adminLogsRouter };
