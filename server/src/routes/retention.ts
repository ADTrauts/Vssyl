import express from 'express';
import {
  getRetentionPolicies,
  createRetentionPolicy,
  updateRetentionPolicy,
  deleteRetentionPolicy,
  getRetentionStatus,
  triggerCleanup,
  getDataClassifications,
  classifyData,
  getBackupRecords,
  createBackup,
  getClassificationRules,
  createClassificationRule,
  updateClassificationRule,
  deleteClassificationRule,
  getClassificationTemplates,
  createClassificationTemplate,
  bulkClassifyData,
  getExpiringClassifications,
  autoClassifyData
} from '../controllers/retentionController';

const router: express.Router = express.Router();

// Retention policy routes
router.get('/policies', getRetentionPolicies);
router.post('/policies', createRetentionPolicy);
router.put('/policies/:id', updateRetentionPolicy);
router.delete('/policies/:id', deleteRetentionPolicy);

// Retention status and cleanup
router.get('/status', getRetentionStatus);
router.post('/cleanup', triggerCleanup);

// Data classification routes
router.get('/classifications', getDataClassifications);
router.post('/classifications', classifyData);

// Classification rules routes
router.get('/classification-rules', getClassificationRules);
router.post('/classification-rules', createClassificationRule);
router.put('/classification-rules/:id', updateClassificationRule);
router.delete('/classification-rules/:id', deleteClassificationRule);

// Classification templates routes
router.get('/classification-templates', getClassificationTemplates);
router.post('/classification-templates', createClassificationTemplate);

// Bulk classification routes
router.post('/bulk-classify', bulkClassifyData);
router.get('/expiring-classifications', getExpiringClassifications);
router.post('/auto-classify', autoClassifyData);

// Backup routes
router.get('/backups', getBackupRecords);
router.post('/backups', createBackup);

export default router; 