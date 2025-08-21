import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { 
  getPersonalAuditLogs, 
  exportPersonalAuditLogs, 
  getPersonalAuditStats 
} from '../controllers/auditController';

const router = Router();

// Personal audit log routes
router.get('/personal', authenticateJWT, getPersonalAuditLogs);
router.get('/personal/export', authenticateJWT, exportPersonalAuditLogs);
router.get('/personal/stats', authenticateJWT, getPersonalAuditStats);

export default router; 