import express from 'express';
import {
  getGovernancePolicies,
  createGovernancePolicy,
  updateGovernancePolicy,
  deleteGovernancePolicy,
  enforceGovernancePolicies,
  getPolicyViolations,
  resolvePolicyViolation
} from '../controllers/governanceController';

const router: express.Router = express.Router();

// Governance policy routes
router.get('/policies', getGovernancePolicies);
router.post('/policies', createGovernancePolicy);
router.put('/policies/:id', updateGovernancePolicy);
router.delete('/policies/:id', deleteGovernancePolicy);

// Policy enforcement routes
router.post('/enforce', enforceGovernancePolicies);

// Policy violation routes
router.get('/violations', getPolicyViolations);
router.put('/violations/:id/resolve', resolvePolicyViolation);

export default router; 