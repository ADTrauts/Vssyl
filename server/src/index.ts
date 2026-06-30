import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { execSync, spawnSync } from 'child_process';

// Prefer server/.env; fall back to monorepo root when dev runs from `server/` only
const serverEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from './auth';
import { prisma } from './lib/prisma';
import dashboardRouter from './routes/dashboard';
import widgetRouter from './routes/widget';
import fileRouter from './routes/file';
import folderRouter from './routes/folder';
import driveRouter from './routes/drive';
import todoRouter from './routes/todo';
import notesRouter from './routes/notes';
import notebookRouter from './routes/notebook';
import vlinksRouter from './routes/vlinks';
import contextGraphRouter from './routes/context-graph';
import chatRouter from './routes/chat';
import businessRouter from './routes/business';
import businessInvitePublicRouter from './routes/businessInvitePublic';
import supportRouter from './routes/support';
import contactRouter from './routes/contact';
import webhookSubscriptionsRouter from './routes/webhookSubscriptions';
import { createInternalWebhookTestRouter } from './routes/internalWebhookTest';
import educationalRouter from './routes/educational';
import householdRouter from './routes/household';
import ssoRouter from './routes/sso';
import googleOAuthRouter from './routes/googleOAuth';
import healthRouter from './routes/health';
import cors from 'cors';
import { startCleanupJob } from './services/cleanupService';
import { initializeChatSocketService, getChatSocketService } from './services/chatSocketService';
import { registerDomainEventSubscribers } from './events/registerDomainEventSubscribers';
import { registerBuiltInModulesOnStartup } from './startup/registerBuiltInModules';
import { syncAllPartnerSearchDelegatesFromDatabase } from './marketplace/syncPartnerSearchDelegates';
import { syncAllPartnerActivityIngestFromDatabase } from './marketplace/syncPartnerActivityIngest';
import { syncAllPartnerWorkspaceParticipationsFromDatabase } from './marketplace/syncPartnerWorkspaceParticipations';
import { registerGlobalTrashHandlers } from './startup/registerGlobalTrashHandlers';
import { registerPlatformEntities } from './startup/registerPlatformEntities';
import { seedHRModuleOnStartup } from './startup/seedHRModule';
import { seedTodoModuleOnStartup } from './startup/seedTodoModule';
import { seedNotesModuleOnStartup } from './startup/seedNotesModule';
import { seedNotebookModuleOnStartup } from './startup/seedNotebookModule';
import { seedSchedulingModuleOnStartup } from './startup/seedSchedulingModule';
import { seedWorkforceCommsModuleOnStartup } from './startup/seedWorkforceCommsModule';
import { registerPlatformCronJobs } from './jobs/platformCronJobs';
import type { JwtPayload } from 'jsonwebtoken';
import userRouter from './routes/user';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import settingsRouter from './routes/settings';
import accountEntitlementsRouter from './routes/accountEntitlements';
import memberRouter from './routes/member';
import searchRouter from './routes/search';
import trashRouter from './routes/trash';
import moduleRouter from './routes/module';
import analyticsRouter from './routes/analytics';
import auditRouter from './routes/audit';
import privacyRouter from './routes/privacy';
import retentionRouter from './routes/retention';
import notificationRouter from './routes/notification';
import pushNotificationRouter from './routes/pushNotification';
import emailNotificationRouter from './routes/emailNotification';
// import advancedNotificationRouter from './routes/advancedNotification'; // Temporarily disabled - functions not implemented
import governanceRouter from './routes/governance';
import aiRouter from './routes/ai';
import aiPreferencesRouter from './routes/ai-preferences';
import aiEffectivePreferencesRouter from './routes/ai-effective-preferences';
import aiIdentityRouter from './routes/ai-identity';
import aiSessionPreferencesRouter from './routes/ai-session-preferences';
import aiAutonomyRouter from './routes/ai-autonomy';
import aiIntelligenceRouter from './routes/ai-intelligence';
import { requireAdmin } from './routes/admin-portal/adminPortalAuth';
import {
  centralizedAiDeprecatedMiddleware,
} from './middleware/centralizedAiFence';
import aiAutonomousRouter from './routes/ai/autonomous';
import aiStatsRouter from './routes/ai-stats';
import aiPersonalityRouter from './routes/ai-personality';
import aiPatternsRouter from './routes/ai-patterns';
import aiUserContextRouter from './routes/ai-user-context';
import billingRouter from './routes/billing';
import pricingRouter from './routes/pricing';
import featureGatingRouter from './routes/featureGating';
import featuresRouter from './routes/features';
import paymentRouter from './routes/payment';
import { handleWebhook } from './controllers/paymentController';
import developerPortalRouter from './routes/developerPortal';
import locationRouter from './routes/location';
import adminRouter from './routes/admin';
import adminPortalRouter from './routes/admin-portal';
import calendarRouter from './routes/calendar';
import orgChartRouter from './routes/org-chart';
import businessAIRouter from './routes/businessAI';
import adminBusinessAIRouter from './routes/adminBusinessAI';
import aiContextDebugRouter from './routes/ai-context-debug';
import { aiContextDebugTransitionalMiddleware } from './middleware/aiContextDebugTransitional';
import aiConversationsRouter from './routes/aiConversations';
import userMemoryFactsRouter from './routes/userMemoryFacts';
import aiQueriesRouter from './routes/aiQueries';
import usageRouter from './routes/usage';
import profilePhotosRouter from './routes/profilePhotos';
import adminSetupRouter from './routes/admin-setup';
import contentReportsRouter from './routes/contentReports';
import adminSeedModulesRouter from './routes/admin-seed-modules';
import moduleAIContextRouter from './routes/moduleAIContext';
import businessFrontPageRouter from './routes/businessFrontPage';
import { adminLogsRouter } from './routes/admin-logs';
import adminPortalTestingRouter from './routes/admin-portal-testing';
import hrRouter from './routes/hr';
import schedulingRouter from './routes/scheduling';
import workforceCommsRouter from './routes/workforceComms';
import activityFeedRouter from './routes/activityFeed';
import debugModulesRouter from './routes/debug-modules';
import debugDatabaseRouter from './routes/debug-database';
import debugBusinessTierRouter from './routes/debug-business-tier';
import adminOverrideRouter from './routes/admin-override';
import adminHRSetupRouter from './routes/admin-hr-setup';
import adminFixHRRouter from './routes/admin-fix-hr';
import adminCreateHRTablesRouter from './routes/admin-create-hr-tables';
import adminFixSubscriptionsRouter from './routes/admin-fix-subscriptions';
import aiProviderUsageRouter from './routes/ai-provider-usage';
import placeRouter from './routes/place';
import { authenticateJWT, getUserFromRequest } from './middleware/auth';
import { logger } from './lib/logger';
import { buildExpressErrorResponse } from './lib/expressErrorHandlerResponse';
import { asyncHandler } from './utils/asyncHandler';

export { asyncHandler };



const app: express.Application = express();
registerGlobalTrashHandlers();
registerPlatformEntities();
const port = process.env.PORT || 5000;
/** Avoid per-request debug logging in production (scheduling troubleshooting middleware). */
const isDevRuntime = process.env.NODE_ENV !== 'production';



void logger.info('Starting server', { operation: 'server_boot' });

// CATCH-ALL logger — scheduling availability (dev-only; was very noisy in production)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    isDevRuntime &&
    req.method === 'POST' &&
    req.originalUrl.includes('/api/scheduling/me/availability')
  ) {
    console.log('🔥 [EXPRESS ENTRY] POST request reached Express:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'authorization': req.headers.authorization ? 'present' : 'missing'
      }
    });
  }
  next();
});

// Stripe webhook MUST use raw body for signature verification and MUST NOT pass JWT auth.
// Registered before express.json() so the body is not parsed as JSON.
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(handleWebhook)
);

app.use(express.json());
app.use(passport.initialize() as express.RequestHandler);

// Request timeout middleware - prevents hanging requests
// Set timeout to 30 seconds for most requests, 2 minutes for file uploads and AI queries
app.use((req: Request, res: Response, next: NextFunction) => {
  const isUpload = req.path.includes('/upload') || req.path.includes('/file');
  const isAIQuery = req.path.includes('/api/ai/twin') || req.path.includes('/api/ai/chat') || req.path.includes('/api/business-ai/');
  const timeoutDuration = isUpload || isAIQuery ? 120000 : 30000;
  req.setTimeout(timeoutDuration, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Gateway Timeout', message: 'Request timeout' });
    }
  });
  next();
});

// Global request logger for debugging POST requests to scheduling (dev-only)
// This MUST be after body parser but before routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isDevRuntime) {
    next();
    return;
  }
  // Log ALL POST requests to /api/scheduling to help debug
  if (req.method === 'POST' && req.originalUrl.includes('/api/scheduling')) {
    console.log('🌐 [GLOBAL] POST request to /api/scheduling received:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      url: req.url,
      baseUrl: req.baseUrl,
      query: req.query,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyPreview: req.body ? JSON.stringify(req.body).substring(0, 200) : null,
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentLength: req.headers['content-length']
    });
  }
  // Also log ALL requests that match /api/scheduling/me/availability regardless of method
  if (req.originalUrl.includes('/api/scheduling/me/availability')) {
    console.log('🚨 [GLOBAL] Request to /api/scheduling/me/availability:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      url: req.url
    });
  }
  next();
});
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In development, allow localhost origins
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://vssyl.com',
      'https://vssyl.com',
      'https://vssyl-web-235369681725.us-central1.run.app', // Cloud Run web service
    ];
    
    // Add localhost origins for development
    if (isDevelopment) {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002'
      );
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add general request logging with structured logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log the incoming request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logApiRequest(
      req.method,
      req.originalUrl,
      getUserFromRequest(req)?.id,
      duration,
      res.statusCode,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );
  });
  
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/profile', authenticateJWT, profileRouter);
app.use('/api/settings', authenticateJWT, settingsRouter);
app.use('/api/account', authenticateJWT, accountEntitlementsRouter);

// Health check routes (no authentication required)
app.use('/api', healthRouter);

app.use('/api/dashboard', authenticateJWT, dashboardRouter);
app.use('/api/widget', authenticateJWT, widgetRouter);
app.use('/api/activity-feed', authenticateJWT, activityFeedRouter);
if (isDevRuntime) {
  console.log('[DEBUG] Registering /api/drive route');
}
app.use('/api/drive', driveRouter);
app.use('/api/todo', todoRouter);
app.use('/api/notes', notesRouter);
app.use('/api/notebook', notebookRouter);
app.use('/api/vlinks', vlinksRouter);
app.use('/api/context-graph', contextGraphRouter);
app.use('/api/folder', folderRouter);
app.use('/api/chat', authenticateJWT, chatRouter);
app.use('/api/business/invite', businessInvitePublicRouter);
app.use('/api/business', authenticateJWT, businessRouter);
app.use('/api/business', authenticateJWT, webhookSubscriptionsRouter);
app.use('/api/internal', createInternalWebhookTestRouter());
app.use('/api/business-front', authenticateJWT, businessFrontPageRouter);
app.use('/api/educational', authenticateJWT, educationalRouter);
app.use('/api/household', authenticateJWT, householdRouter);
app.use('/api/sso', ssoRouter);
app.use('/api/google-oauth', googleOAuthRouter);
app.use('/api/user', authenticateJWT, userRouter);
app.use('/api/member', memberRouter);
app.use('/api/search', authenticateJWT, searchRouter);
app.use('/api/trash', authenticateJWT, trashRouter);
app.use('/api/modules', authenticateJWT, moduleRouter);
app.use('/api/analytics', authenticateJWT, analyticsRouter);
app.use('/api/audit', authenticateJWT, auditRouter);
app.use('/api/privacy', authenticateJWT, privacyRouter);
app.use('/api/retention', authenticateJWT, retentionRouter);
app.use('/api/notifications', authenticateJWT, notificationRouter);
app.use('/api/push-notifications', authenticateJWT, pushNotificationRouter);
app.use('/api/email-notifications', authenticateJWT, emailNotificationRouter);
// app.use('/api/advanced-notifications', authenticateJWT, advancedNotificationRouter); // Temporarily disabled - functions not implemented
app.use('/api/governance', authenticateJWT, governanceRouter);
app.use('/api/ai', authenticateJWT, aiRouter);
app.use('/api/ai', authenticateJWT, aiPreferencesRouter);
app.use('/api/ai/effective-preferences', authenticateJWT, aiEffectivePreferencesRouter);
app.use('/api/ai/identity', authenticateJWT, aiIdentityRouter);
app.use('/api/ai/preferences', authenticateJWT, aiSessionPreferencesRouter);
app.use('/api/ai/autonomy', authenticateJWT, aiAutonomyRouter);
app.use('/api/ai/intelligence', authenticateJWT, aiIntelligenceRouter);
app.use('/api/ai/autonomous', authenticateJWT, aiAutonomousRouter);
app.use('/api/ai-stats', authenticateJWT, aiStatsRouter);
app.use('/api/ai/personality', authenticateJWT, aiPersonalityRouter);
app.use('/api/ai/patterns', authenticateJWT, aiPatternsRouter);
app.use('/api/ai/user-context', authenticateJWT, aiUserContextRouter);
/** @deprecated Wave 1B — use /api/ai/user-context; retained for non-GET CRUD callers during migration */
app.use('/api/ai/context', authenticateJWT, aiUserContextRouter);
/** Wave 1D / 0D-B / 0D-G — admin-only retired mount; all paths return 410. Twin path: POST /api/ai/twin */
app.use(
  '/api/centralized-ai',
  authenticateJWT,
  requireAdmin,
  centralizedAiDeprecatedMiddleware
);
app.use('/api/billing', authenticateJWT, billingRouter);
app.use('/api/support', authenticateJWT, supportRouter);
app.use('/api/contact', contactRouter);
app.use('/api/pricing', pricingRouter); // Public read access, admin write access
app.use('/api/feature-gating', authenticateJWT, featureGatingRouter);
app.use('/api/features', featuresRouter);
app.use('/api/payment', authenticateJWT, paymentRouter);
app.use('/api/developer', authenticateJWT, developerPortalRouter);
app.use('/api/location', locationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin-portal', adminPortalRouter);
app.use('/api/admin-portal/testing', adminPortalTestingRouter);
app.use('/api/admin/ai-providers', aiProviderUsageRouter);
app.use('/api/org-chart', orgChartRouter);
app.use('/api/calendar', authenticateJWT, calendarRouter);
app.use('/api/business-ai', businessAIRouter);
app.use('/api/admin/business-ai', adminBusinessAIRouter);
app.use('/api/ai-context-debug', aiContextDebugTransitionalMiddleware, aiContextDebugRouter);
app.use('/api/ai-conversations', authenticateJWT, aiConversationsRouter);
app.use('/api/ai/memory/facts', authenticateJWT, userMemoryFactsRouter);
app.use('/api/ai/queries', authenticateJWT, aiQueriesRouter);
app.use('/api/usage', authenticateJWT, usageRouter);
app.use('/api/profile-photos', profilePhotosRouter);
{
  const enableAdminSetup = process.env.ENABLE_ADMIN_SETUP_ROUTES === 'true';
  const setupSecret = process.env.ADMIN_SETUP_SECRET?.trim() ?? '';
  if (enableAdminSetup && setupSecret.length >= 16) {
    app.use('/api/admin-setup', adminSetupRouter);
  } else if (enableAdminSetup && setupSecret.length < 16) {
    void logger.warn('ENABLE_ADMIN_SETUP_ROUTES is set but ADMIN_SETUP_SECRET is missing or shorter than 16 characters; /api/admin-setup not mounted', {
      operation: 'admin_setup_misconfigured',
    });
  }
}
app.use('/api/content-reports', contentReportsRouter);
app.use('/api/admin/seed', authenticateJWT, adminSeedModulesRouter);
app.use('/api', moduleAIContextRouter);
app.use('/api/admin/logs', authenticateJWT, adminLogsRouter);
app.use('/api/place', placeRouter); // Vssyl Place module routes (includes own auth)
app.use('/api/hr', hrRouter); // HR module routes (includes own auth checks)
app.use(
  '/api/scheduling',
  (req, res, next) => {
    if (isDevRuntime) {
      console.log('🔍 [INDEX] Request to /api/scheduling - Mount point reached', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        url: req.url,
        baseUrl: req.baseUrl,
        query: req.query,
        hasBody: !!req.body,
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'present' : 'missing',
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });
    }
    next();
  },
  schedulingRouter
); // Scheduling module routes (includes own auth checks)
app.use('/api/workforce-comms', workforceCommsRouter); // Workforce Communications routes

// Log registered scheduling routes on startup
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Scheduling router mounted at /api/scheduling');
  
  // Detailed route inspection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postAvailabilityRoute = schedulingRouter.stack.find((layer: any) => 
    layer.route?.methods?.post && layer.route?.path === '/me/availability'
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getAvailabilityRoute = schedulingRouter.stack.find((layer: any) => 
    layer.route?.methods?.get && layer.route?.path === '/me/availability'
  );
  
  console.log('✅ Available routes:', {
    postAvailability: !!postAvailabilityRoute,
    postAvailabilityDetails: postAvailabilityRoute ? {
      path: (postAvailabilityRoute.route as any)?.path,
      methods: (postAvailabilityRoute.route as any)?.methods,
      stackLength: (postAvailabilityRoute.route as any)?.stack?.length
    } : null,
    getAvailability: !!getAvailabilityRoute,
    totalRoutes: schedulingRouter.stack?.length || 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allRoutes: schedulingRouter.stack.map((layer: any) => ({
      path: layer.route?.path,
      methods: (layer.route as any)?.methods,
      regex: layer.regexp?.toString()
    })).filter((r: any) => r.path)
  });
}
const mountPublicDebugRoutes =
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_PUBLIC_DEBUG_ROUTES === 'true';
if (mountPublicDebugRoutes) {
  app.use('/api/debug', debugModulesRouter);
  app.use('/api/debug/database', debugDatabaseRouter);
} else {
  void logger.info('Public debug routes not mounted (set ENABLE_PUBLIC_DEBUG_ROUTES=true to enable in production)', {
    operation: 'debug_public_routes_skipped',
  });
}
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_BUSINESS_TIER === 'true') {
  app.use('/api/debug/business-tier', debugBusinessTierRouter); // Admin JWT + ADMIN role only
}
app.use('/api/admin-override', adminOverrideRouter); // Admin override endpoints (requires ADMIN role)
app.use('/api/admin/hr-setup', authenticateJWT, adminHRSetupRouter); // Admin HR setup endpoints (manual seeding & diagnostics)
app.use('/api/admin/fix-hr', authenticateJWT, adminFixHRRouter); // Emergency HR fix endpoints (migrations & raw DB access)
app.use('/api/admin/create-hr-tables', authenticateJWT, adminCreateHRTablesRouter); // Manually create HR tables via raw SQL
app.use('/api/admin/fix-subscriptions', authenticateJWT, adminFixSubscriptionsRouter); // Fix subscriptions table schema

// Schedule cleanup jobs
startCleanupJob();

if (process.env.ENABLE_PATTERN_ANALYSIS_SCHEDULER === 'true') {
  void import('./ai/learning/PatternAnalysisScheduler.js').then(({ PatternAnalysisScheduler }) => {
    const scheduler = new PatternAnalysisScheduler(prisma);
    void scheduler.start();
  });
}

const isProd = process.env.NODE_ENV === 'production';

// Generic catch-all for unhandled routes
app.use((req: Request, res: Response) => {
  // Enhanced logging for scheduling availability routes
  if (!isProd && (req.originalUrl.includes('/scheduling/me/availability') || req.path.includes('/me/availability'))) {
    console.log(`🚨 [404 HANDLER] Unhandled scheduling availability route: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      url: req.url,
      route: req.route?.path,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'present' : 'missing'
      }
    });
  }
  if (!isProd) {
    console.log(`[DEBUG] Unhandled route: ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({ message: 'Not Found' });
});

// Centralized error-handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string | number;
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Ensure we always have an Error object to work with
  const error = (err instanceof Error ? err : new Error(String(err))) as ErrorWithStatus;

  const { status, body } = buildExpressErrorResponse(error, isProd);

  void logger
    .error('Unhandled request error', {
      operation: 'express_error_handler',
      path: req.originalUrl,
      method: req.method,
      status,
      error: {
        message: error.message,
        stack: error.stack,
      },
    })
    .catch(() => undefined);

  res.status(status).json(body);
});

/** Failed deploys left rows in `_prisma_migrations`; Prisma then returns P3009 until resolved. */
const RECOVERABLE_FAILED_MIGRATIONS = [
  '20260419203000_tasks_tags_not_null_default',
  /** Duplicate CREATE TYPE in first draft; migration is idempotent after resolve + redeploy. */
  '20260522120100_ai_suggestion_enums',
] as const;

function findRecoverableFailedMigration(combinedOutput: string): string | null {
  const isFailedState =
    combinedOutput.includes('P3009') ||
    combinedOutput.includes('P3018') ||
    combinedOutput.includes('migrate found failed migrations in the target database');
  if (!isFailedState) {
    return null;
  }
  for (const migrationName of RECOVERABLE_FAILED_MIGRATIONS) {
    if (combinedOutput.includes(migrationName)) {
      return migrationName;
    }
  }
  return null;
}

function spawnPrisma(
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeout: number }
): { ok: boolean; combined: string } {
  const r = spawnSync('npx', ['prisma', ...args], {
    cwd: options.cwd,
    env: options.env,
    timeout: options.timeout,
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  const stdout = typeof r.stdout === 'string' ? r.stdout : '';
  const stderr = typeof r.stderr === 'string' ? r.stderr : '';
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const errMsg = r.error instanceof Error ? r.error.message : '';
  const combined = `${stderr}\n${stdout}\n${errMsg}`;
  return { ok: r.status === 0, combined };
}

async function runProductionStartupMigrations(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  void logger.info('Running production startup migrations', { operation: 'prisma_migrate_start' }).catch(() => undefined);

  const projectRoot = path.join(__dirname, '../..');
  const buildScriptPath = path.join(projectRoot, 'scripts/build-prisma-schema.js');
  const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');
  const migrationsDir = path.join(projectRoot, 'prisma/migrations');

  if (!fs.existsSync(buildScriptPath)) {
    throw new Error(`Prisma build script not found: ${buildScriptPath}`);
  }
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found: ${schemaPath}`);
  }
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Prisma migrations directory not found: ${migrationsDir}`);
  }

  const migrationDirectories = fs.readdirSync(migrationsDir).filter((entry: string) =>
    fs.statSync(path.join(migrationsDir, entry)).isDirectory()
  );

  void logger.info('Prisma migration directories found', {
    operation: 'prisma_migrate',
    count: migrationDirectories.length,
  }).catch(() => undefined);
  void logger.info('Building Prisma schema from modules', { operation: 'prisma_schema_build' }).catch(() => undefined);
  execSync(`node "${buildScriptPath}"`, {
    stdio: 'inherit',
    env: process.env,
    cwd: projectRoot,
  });

  let migrationUrl = process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL;
  if (!migrationUrl) {
    throw new Error('DATABASE_URL is required for startup migrations');
  }

  if (!migrationUrl.includes('connection_limit=')) {
    const separator = migrationUrl.includes('?') ? '&' : '?';
    migrationUrl = `${migrationUrl}${separator}connection_limit=5&pool_timeout=30&connect_timeout=60`;
  } else {
    migrationUrl = migrationUrl.replace(/connection_limit=\d+/, 'connection_limit=5');
    if (!migrationUrl.includes('pool_timeout=')) {
      migrationUrl += '&pool_timeout=30';
    }
    if (!migrationUrl.includes('connect_timeout=')) {
      migrationUrl += '&connect_timeout=60';
    }
  }

  await prisma.$disconnect().catch(() => undefined);

  const migrateEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: migrationUrl,
  };
  const execOpts = { cwd: projectRoot, env: migrateEnv, timeout: 120000 };

  const deployArgs = ['migrate', 'deploy', '--schema', schemaPath];
  let first = spawnPrisma(deployArgs, execOpts);
  const recoverableMigration = !first.ok ? findRecoverableFailedMigration(first.combined) : null;
  if (recoverableMigration) {
    void logger
      .warn('Recovering failed migration (resolve rolled-back, then redeploy)', {
        operation: 'prisma_migrate_recovery',
        migration: recoverableMigration,
      })
      .catch(() => undefined);

    const resolveResult = spawnPrisma(
      ['migrate', 'resolve', '--rolled-back', recoverableMigration, '--schema', schemaPath],
      execOpts
    );
    if (!resolveResult.ok) {
      throw new Error(
        `prisma migrate resolve --rolled-back failed for ${recoverableMigration}: ${resolveResult.combined}`
      );
    }
    first = spawnPrisma(deployArgs, execOpts);
  }
  if (!first.ok) {
    throw new Error(`prisma migrate deploy failed: ${first.combined}`);
  }

  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  void logger.info('Production migrations and database readiness checks passed', {
    operation: 'prisma_migrate_complete',
  }).catch(() => undefined);
}

// Initialize HTTP server
const httpServer = createServer(app);

async function handleServerListening(): Promise<void> {
  void logger.info('Server listening', { operation: 'http_listen', port }).catch(() => undefined);

  // Seed modules if they don't exist (non-blocking)
  try {
    await seedHRModuleOnStartup();
    await seedTodoModuleOnStartup();
    await seedNotesModuleOnStartup();
    await seedNotebookModuleOnStartup();
    await seedSchedulingModuleOnStartup();
    await seedWorkforceCommsModuleOnStartup();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Module seed failed (non-critical)', {
      operation: 'startup_module_seed',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Register built-in modules if registry is empty (non-blocking)
  try {
    await registerBuiltInModulesOnStartup();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Module registration startup failed (non-critical)', {
      operation: 'startup_module_registry',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  try {
    await syncAllPartnerSearchDelegatesFromDatabase();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Partner search delegate sync failed (non-critical)', {
      operation: 'startup_partner_search_delegate_sync',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  try {
    await syncAllPartnerWorkspaceParticipationsFromDatabase();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Partner workspace participation sync failed (non-critical)', {
      operation: 'startup_partner_workspace_participation_sync',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  try {
    await syncAllPartnerActivityIngestFromDatabase();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Partner activity ingest sync failed (non-critical)', {
      operation: 'startup_partner_activity_ingest_sync',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  try {
    registerGlobalTrashHandlers();
    registerPlatformEntities();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Global Trash handler registration failed (non-critical)', {
      operation: 'startup_global_trash_handlers',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Platform cron jobs (Batch 4 — registerPlatformJob)
  try {
    await registerPlatformCronJobs();
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to register platform cron jobs', {
      operation: 'platform_cron_jobs_register',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }
}

async function bootstrap(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    try {
      await runProductionStartupMigrations();
    } catch (error) {
      const err = error as Error;
      await logger.error('Production startup blocked by failed migrations or readiness checks', {
        operation: 'startup_readiness_failed',
        error: {
          message: err.message,
          stack: err.stack,
        },
      }).catch(() => undefined);
      throw error;
    }
  }

  initializeChatSocketService(httpServer);
  registerDomainEventSubscribers();
  await getChatSocketService().attachRedisAdapterIfConfigured();

  httpServer
    .listen(port, () => {
      void logger.info('HTTP server bind starting', { operation: 'http_listen', port }).catch(() => undefined);
    })
    .on('listening', () => {
      handleServerListening().catch((error: unknown) => {
        const err = error as Error;
        void logger.error('Post-listen initialization failed', {
          operation: 'http_post_listen',
          error: { message: err.message, stack: err.stack },
        }).catch(() => undefined);
      });
    })
    .on('error', (err: Error) => {
      void logger.error('Server startup error', {
        operation: 'http_listen_error',
        error: { message: err.message, stack: err.stack },
      }).catch(() => undefined);
      process.exit(1);
    });
}

bootstrap().catch((error: unknown) => {
  const err = error as Error;
  void logger
    .error('Fatal startup error', {
      operation: 'bootstrap_fatal',
      error: { message: err.message, stack: err.stack },
    })
    .catch(() => undefined);
  process.exit(1);
});

export default app;
