import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import adminSecurityRoutes from './adminSecurityRoutes';
import { requireAdmin } from './admin-portal/adminPortalAuth';
import { registerAdminPortalCoreRoutes } from './admin-portal/adminPortalRoutes.core';
import { registerAdminPortalAnalyticsOpsRoutes } from './admin-portal/adminPortalRoutes.analyticsOps';
import { registerAdminPortalPlatformRoutes } from './admin-portal/adminPortalRoutes.platform';
import { registerAdminPortalAiPipelineRoutes } from './admin-portal/adminPortalRoutes.aiPipeline';
import { registerAdminPortalAdoptionRoutes } from './admin-portal/adminPortalRoutes.adoption';

const router: express.Router = express.Router();

/** Bounded domains: core (dashboard, impersonation, users, moderation reports), analytics/ops, platform (BI, support, performance, DB, integrations). */
registerAdminPortalCoreRoutes(router);
registerAdminPortalAnalyticsOpsRoutes(router);
registerAdminPortalPlatformRoutes(router);
registerAdminPortalAiPipelineRoutes(router);
registerAdminPortalAdoptionRoutes(router);

router.use('/security', authenticateJWT, requireAdmin, adminSecurityRoutes);

export default router;
