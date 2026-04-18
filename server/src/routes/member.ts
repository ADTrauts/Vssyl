import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import {
  searchUsers,
  sendConnectionRequest,
  updateConnectionRequest,
  getConnections,
  getPendingRequests,
  getSentRequests,
  removeConnection,
  bulkRemoveConnections,
  bulkUpdateConnectionRequests,
  inviteEmployee,
  getBusinessMembers,
  getPinnedColleagues,
  pinColleague,
  unpinColleague,
  updateEmployeeRole,
  removeEmployee,
  getBusinessInvitations,
  resendInvitation,
  cancelInvitation,
  bulkInviteEmployees,
  bulkUpdateEmployeeRoles,
  bulkRemoveEmployees,
} from '../controllers/memberController';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

router.use(authenticateJWT);

const businessIdParam = validate([param('businessId').isUUID()]);
const relationshipIdParam = validate([param('relationshipId').isUUID()]);
const memberIdParam = validate([param('memberId').isUUID()]);
const invitationIdParam = validate([param('invitationId').isUUID()]);
const pinnedUserIdParam = validate([param('pinnedUserId').isUUID()]);

// Personal Connection Routes
router.get(
  '/users/search',
  validate([
    query('query').isString().notEmpty().isLength({ max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ]),
  searchUsers
);
router.post('/connections/request', sendConnectionRequest);
router.put('/connections/:relationshipId', relationshipIdParam, updateConnectionRequest);
router.get('/connections', getConnections);
router.get('/connections/pending', getPendingRequests);
router.get('/connections/sent', getSentRequests);
router.delete('/connections/:relationshipId', relationshipIdParam, removeConnection);

// Bulk Operations Routes
router.post('/connections/bulk/remove', bulkRemoveConnections);
router.post('/connections/bulk/requests', bulkUpdateConnectionRequests);

// Business Employee Management Routes
router.post('/business/:businessId/invite', businessIdParam, inviteEmployee);
router.get('/business/:businessId/members', businessIdParam, getBusinessMembers);
router.get('/business/:businessId/pinned', businessIdParam, getPinnedColleagues);
router.post(
  '/business/:businessId/pinned',
  businessIdParam,
  validate([body('pinnedUserId').isUUID()]),
  pinColleague
);
router.delete(
  '/business/:businessId/pinned/:pinnedUserId',
  businessIdParam,
  pinnedUserIdParam,
  unpinColleague
);
router.put('/business/members/:memberId/role', memberIdParam, updateEmployeeRole);
router.delete('/business/members/:memberId', memberIdParam, removeEmployee);
router.get('/business/:businessId/invitations', businessIdParam, getBusinessInvitations);
router.post('/business/invitations/:invitationId/resend', invitationIdParam, resendInvitation);
router.delete('/business/invitations/:invitationId', invitationIdParam, cancelInvitation);

// Business Member Bulk Operations Routes
router.post('/business/:businessId/bulk/invite', businessIdParam, bulkInviteEmployees);
router.put('/business/:businessId/bulk/roles', businessIdParam, bulkUpdateEmployeeRoles);
router.delete('/business/:businessId/bulk/remove', businessIdParam, bulkRemoveEmployees);

export default router;
