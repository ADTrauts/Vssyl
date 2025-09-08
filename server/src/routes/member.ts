import express from 'express';
import {
  // Personal connection APIs
  searchUsers,
  sendConnectionRequest,
  updateConnectionRequest,
  getConnections,
  getPendingRequests,
  removeConnection,
  bulkRemoveConnections,
  bulkUpdateConnectionRequests,
  // Business employee management APIs
  inviteEmployee,
  getBusinessMembers,
  updateEmployeeRole,
  removeEmployee,
  getBusinessInvitations,
  resendInvitation,
  cancelInvitation,
  // Business member bulk operations
  bulkInviteEmployees,
  bulkUpdateEmployeeRoles,
  bulkRemoveEmployees,
} from '../controllers/memberController';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Personal Connection Routes
router.get('/users/search', searchUsers);
router.post('/connections/request', sendConnectionRequest);
router.put('/connections/:relationshipId', updateConnectionRequest);
router.get('/connections', getConnections);
router.get('/connections/pending', getPendingRequests);
router.delete('/connections/:relationshipId', removeConnection);

// Bulk Operations Routes
router.post('/connections/bulk/remove', bulkRemoveConnections);
router.post('/connections/bulk/requests', bulkUpdateConnectionRequests);

// Business Employee Management Routes
router.post('/business/:businessId/invite', inviteEmployee);
router.get('/business/:businessId/members', getBusinessMembers);
router.put('/business/members/:memberId/role', updateEmployeeRole);
router.delete('/business/members/:memberId', removeEmployee);
router.get('/business/:businessId/invitations', getBusinessInvitations);
router.post('/business/invitations/:invitationId/resend', resendInvitation);
router.delete('/business/invitations/:invitationId', cancelInvitation);

// Business Member Bulk Operations Routes
router.post('/business/:businessId/bulk/invite', bulkInviteEmployees);
router.put('/business/:businessId/bulk/roles', bulkUpdateEmployeeRoles);
router.delete('/business/:businessId/bulk/remove', bulkRemoveEmployees);

export default router; 