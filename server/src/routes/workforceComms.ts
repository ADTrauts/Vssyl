/**
 * WORKFORCE COMMUNICATIONS API ROUTES
 *
 * 1. Admin routes: /admin/* — authoring, campaigns, migration (admin / manager+canManage)
 * 2. Employee routes: /feed, /communications/*, /pending-acks
 * 3. Public front-page: /public/front-page
 * 4. AI routes: /ai/context/*
 *
 * All routes require authentication and workforce_comms module installation.
 */

import express from 'express';
import { param, query } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { checkWorkforceCommsModuleInstalled } from '../middleware/workforceCommsFeatureGating';
import {
  checkWorkforceCommsAdmin,
  checkWorkforceCommsEmployeeAccess,
} from '../middleware/workforceCommsPermissions';
import { checkWorkforceCommsPolicy } from '../auth/workforceCommsPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import * as workforceCommsController from '../controllers/workforceCommsController';
import { asyncHandler } from '../utils/asyncHandler';

const router: express.Router = express.Router();

const idParam = validate([param('id').isUUID()]);
const attachmentIdParam = validate([param('attachmentId').isUUID()]);
const businessIdQuery = validate([query('businessId').optional().isUUID()]);

router.use(authenticateJWT);
router.use(checkWorkforceCommsModuleInstalled);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

router.get(
  '/admin/communications',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ),
  workforceCommsController.listCommunications
);

router.post(
  '/admin/communications',
  checkWorkforceCommsAdmin,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_CREATE),
  workforceCommsController.createCommunication
);

router.get(
  '/admin/communications/:id',
  checkWorkforceCommsAdmin,
  idParam,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.getCommunication
);

router.put(
  '/admin/communications/:id',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.updateCommunication
);

router.delete(
  '/admin/communications/:id',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.trashCommunication
);

router.post(
  '/admin/communications/:id/publish',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_PUBLISH, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.publishCommunicationHandler
);

router.post(
  '/admin/communications/:id/schedule',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.scheduleCommunicationHandler
);

router.post(
  '/admin/communications/:id/cancel',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.cancelCommunicationHandler
);

router.put(
  '/admin/communications/:id/audience',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.setAudience
);

router.post(
  '/admin/communications/:id/audience/estimate',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.estimateAudience
);

router.get(
  '/admin/communications/:id/report',
  checkWorkforceCommsAdmin,
  idParam,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.getCommunicationReport
);

router.post(
  '/admin/communications/:id/attachments',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.addAttachment
);

router.delete(
  '/admin/attachments/:attachmentId',
  checkWorkforceCommsAdmin,
  attachmentIdParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE),
  workforceCommsController.removeAttachment
);

router.get(
  '/admin/campaigns',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE),
  workforceCommsController.listCampaigns
);

router.post(
  '/admin/campaigns',
  checkWorkforceCommsAdmin,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE),
  workforceCommsController.createCampaignHandler
);

router.get(
  '/admin/campaigns/:id',
  checkWorkforceCommsAdmin,
  idParam,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_campaign',
  }),
  workforceCommsController.getCampaign
);

router.put(
  '/admin/campaigns/:id',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_campaign',
  }),
  workforceCommsController.updateCampaignHandler
);

router.post(
  '/admin/campaigns/:id/complete',
  checkWorkforceCommsAdmin,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_campaign',
  }),
  workforceCommsController.completeCampaignHandler
);

router.post(
  '/admin/migrate/front-page',
  checkWorkforceCommsAdmin,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_CREATE),
  workforceCommsController.migrateFrontPage
);

router.get(
  '/admin/reports/summary',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ),
  workforceCommsController.getSummaryReportHandler
);

router.get(
  '/admin/reports/communications',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ),
  workforceCommsController.getCommunicationsReportHandler
);

router.get(
  '/admin/reports/campaigns',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ),
  workforceCommsController.getCampaignsReportHandler
);

router.get(
  '/admin/reports/acknowledgements',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ),
  workforceCommsController.getAcknowledgementsReportHandler
);

router.get(
  '/admin/bridge/templates',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_BRIDGE_MANAGE),
  workforceCommsController.listBridgeTemplates
);

// ============================================================================
// EMPLOYEE ROUTES
// ============================================================================

router.get(
  '/feed',
  checkWorkforceCommsEmployeeAccess,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ),
  workforceCommsController.getMyFeed
);

router.get(
  '/communications/:id',
  checkWorkforceCommsEmployeeAccess,
  idParam,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  workforceCommsController.getCommunicationForEmployee
);

router.post(
  '/communications/:id/read',
  checkWorkforceCommsEmployeeAccess,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  asyncHandler(workforceCommsController.recordReadHandler)
);

router.post(
  '/communications/:id/acknowledge',
  checkWorkforceCommsEmployeeAccess,
  idParam,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_ACK_MANAGE, {
    resourceIdParam: 'id',
    resourceType: 'workforce_communication',
  }),
  asyncHandler(workforceCommsController.acknowledge)
);

router.get(
  '/pending-acks',
  checkWorkforceCommsEmployeeAccess,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ),
  workforceCommsController.listPendingAcks
);

// ============================================================================
// PUBLIC / FRONT-PAGE
// ============================================================================

router.get(
  '/public/front-page',
  checkWorkforceCommsEmployeeAccess,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ),
  workforceCommsController.listFrontPageCommunications
);

// ============================================================================
// AI CONTEXT ROUTES
// ============================================================================

router.get(
  '/ai/context/overview',
  checkWorkforceCommsEmployeeAccess,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ),
  workforceCommsController.getOverviewForAI
);

router.get(
  '/ai/context/reach',
  checkWorkforceCommsAdmin,
  businessIdQuery,
  checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ),
  workforceCommsController.getReachForAI
);

export default router;
