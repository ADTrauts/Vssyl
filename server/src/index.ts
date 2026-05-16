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
import passport, { issueJWT, registerUser } from './auth';
import jwt from 'jsonwebtoken';
// Import User type - matches pattern from auth.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - User type is available from Prisma client when generated
import type { User } from '@prisma/client';
import { prisma } from './lib/prisma';
import dashboardRouter from './routes/dashboard';
import widgetRouter from './routes/widget';
import fileRouter from './routes/file';
import folderRouter from './routes/folder';
import driveRouter from './routes/drive';
import todoRouter from './routes/todo';
import notesRouter from './routes/notes';
import chatRouter from './routes/chat';
import businessRouter from './routes/business';
import educationalRouter from './routes/educational';
import householdRouter from './routes/household';
import ssoRouter from './routes/sso';
import googleOAuthRouter from './routes/googleOAuth';
import healthRouter from './routes/health';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { 
  createRefreshToken, 
  validateRefreshToken, 
  deleteRefreshToken,
  createPasswordResetToken,
  validatePasswordResetToken,
  deletePasswordResetToken,
  createEmailVerificationToken,
  validateEmailVerificationToken,
  deleteEmailVerificationToken,
  deleteAllUserRefreshTokens
} from './utils/tokenUtils';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail 
} from './services/emailService';
import { startCleanupJob } from './services/cleanupService';
import { initializeChatSocketService, getChatSocketService } from './services/chatSocketService';
import { registerDomainEventSubscribers } from './events/registerDomainEventSubscribers';
import { registerBuiltInModulesOnStartup } from './startup/registerBuiltInModules';
import { seedHRModuleOnStartup } from './startup/seedHRModule';
import { seedTodoModuleOnStartup } from './startup/seedTodoModule';
import { seedNotesModuleOnStartup } from './startup/seedNotesModule';
import { seedSchedulingModuleOnStartup } from './startup/seedSchedulingModule';
import cron from 'node-cron';
import { dispatchDueReminders } from './services/reminderService';
import { AIQueryService } from './services/aiQueryService';
import { OverageBillingService } from './services/overageBillingService';
import type { JwtPayload } from 'jsonwebtoken';
import userRouter from './routes/user';
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
import aiAutonomyRouter from './routes/ai-autonomy';
import aiIntelligenceRouter from './routes/ai-intelligence';
import aiCentralizedRouter from './routes/ai-centralized';
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
import aiConversationsRouter from './routes/aiConversations';
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
import { authenticateJWT, type AuthenticatedRequest, getUserFromRequest } from './middleware/auth';
import { logger } from './lib/logger';
import { logWhenLoggerFails } from './lib/safeLoggerFallback';
import { buildExpressErrorResponse } from './lib/expressErrorHandlerResponse';



const app: express.Application = express();
const port = process.env.PORT || 5000;
/** Avoid per-request debug logging in production (scheduling troubleshooting middleware). */
const isDevRuntime = process.env.NODE_ENV !== 'production';



// Helper function to create user response
function createUserResponse(user: User) {
  const { password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    emailVerified: !!user.emailVerified,
  };
}

// Helper to wrap async route handlers for Express
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler(fn: (...args: any[]) => Promise<any>): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

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

app.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }
  try {
    // Get client IP for location detection
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress;
    
    let user: User;
    try {
      // Test database connection before attempting registration
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (dbTestError) {
        const dbErrorMsg = dbTestError instanceof Error ? dbTestError.message : 'Unknown error';
        void logger
          .error('Registration database connection test failed', {
            operation: 'user_registration',
            error: { message: dbErrorMsg },
          })
          .catch(() => undefined);
        return res.status(503).json({ 
          message: 'Database connection failed. Please try again later.',
          ...(process.env.NODE_ENV === 'development' && { error: dbErrorMsg })
        });
      }
      
      user = await registerUser(email, password, name, clientIP as string);
    } catch (registerError) {
      // Log registration error with details
      const errorMessage = registerError instanceof Error ? registerError.message : 'Unknown error';
      const errorStack = registerError instanceof Error ? registerError.stack : undefined;
      
      // Check for specific Prisma error types
      if (typeof registerError === 'object' && registerError && 'code' in registerError) {
        const errorCode = (registerError as Record<string, unknown>).code;
        if (errorCode === 'P2002') {
          // Unique constraint violation (email already exists)
          return res.status(409).json({ message: 'Email already in use' });
        }
        if (errorCode === 'P1001' || errorCode === 'P1002') {
          // Database connection errors
          return res.status(503).json({ 
            message: 'Database connection failed. Please try again later.',
            ...(process.env.NODE_ENV === 'development' && { error: errorMessage, code: errorCode })
          });
        }
      }
      
      // Check for database connection error messages
      if (errorMessage.includes('Can\'t reach database') || 
          errorMessage.includes('connection pool') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('PrismaClientInitializationError') ||
          errorMessage.includes('P1001') ||
          errorMessage.includes('P1002')) {
        return res.status(503).json({ 
          message: 'Database temporarily unavailable. Please try again.',
          ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
        });
      }
      
      // Log the error (but don't fail if logging fails)
      try {
        await logger.error('User registration failed in registerUser function', {
          operation: 'user_registration',
          email: email,
          ipAddress: clientIP as string,
          userAgent: req.get('user-agent'),
          error: {
            message: errorMessage,
            stack: errorStack
          }
        });
      } catch (logError) {
        // If logging fails, at least log to console
        console.error('Failed to log registration error:', logError);
        console.error('Original registration error:', registerError);
      }
      
      // Re-throw to be caught by outer catch block
      throw registerError;
    }
    
    // Log successful registration (non-blocking)
    try {
      await logger.logUserAction(user.id, 'user_registered', {
        email: user.email,
        ipAddress: clientIP as string,
        userAgent: req.get('user-agent')
      });
    } catch (logError) {
      // Don't fail registration if logging fails
      console.error('Failed to log user action during registration:', logError);
    }
    
    // Send verification email if SMTP is configured, otherwise auto-verify
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Create and send verification email
        try {
          const verificationToken = await createEmailVerificationToken(user.id);
          await sendVerificationEmail(user.email, verificationToken);
        } catch (emailError) {
          await logger.warn('Failed to send verification email during registration', {
            operation: 'user_registration',
            userId: user.id,
            email: user.email,
            error: {
              message: emailError instanceof Error ? emailError.message : 'Unknown error',
              stack: emailError instanceof Error ? emailError.stack : undefined
            }
          });
          // Continue - email verification can be resent later
        }
        
        // Send welcome email (non-critical, don't fail registration if this fails)
        try {
          await sendWelcomeEmail(user.email, user.name || 'there');
        } catch (welcomeEmailError) {
          await logger.warn('Failed to send welcome email during registration', {
            operation: 'user_registration',
            userId: user.id,
            email: user.email,
            error: {
              message: welcomeEmailError instanceof Error ? welcomeEmailError.message : 'Unknown error'
            }
          });
          // Continue - welcome email is not critical
        }
      } else {
        // Auto-verify email if SMTP is not configured
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        });
      }
    } catch (emailConfigError) {
      // If email configuration fails, auto-verify and continue
      await logger.warn('Email configuration error during registration, auto-verifying email', {
        operation: 'user_registration',
        userId: user.id,
        email: user.email,
        error: {
          message: emailConfigError instanceof Error ? emailConfigError.message : 'Unknown error'
        }
      });
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        });
      } catch (updateError) {
        // Log but don't fail - email verification is not critical for registration
        await logger.error('Failed to auto-verify email during registration', {
          operation: 'user_registration',
          userId: user.id,
          error: {
            message: updateError instanceof Error ? updateError.message : 'Unknown error'
          }
        });
      }
    }
    
    const token = issueJWT(user);
    let refreshToken: string;
    try {
      refreshToken = await createRefreshToken(user.id);
    } catch (refreshTokenError) {
      // If refresh token creation fails, log but continue - user can still login
      await logger.error('Failed to create refresh token during registration', {
        operation: 'user_registration',
        userId: user.id,
        error: {
          message: refreshTokenError instanceof Error ? refreshTokenError.message : 'Unknown error',
          stack: refreshTokenError instanceof Error ? refreshTokenError.stack : undefined
        }
      });
      // Set empty string as fallback - user will need to login again to get refresh token
      refreshToken = '';
    }

    // Ensure a personal main calendar exists named after the first tab (use "My Dashboard" as fallback)
    try {
      // Find or create the user's first personal dashboard name
      const personalDash = await prisma.dashboard.findFirst({
        where: { userId: user.id, businessId: null, institutionId: null, householdId: null },
        orderBy: { createdAt: 'asc' }
      });
      const mainName = personalDash?.name || 'My Dashboard';
      const existingCal = await prisma.calendar.findFirst({ where: { contextType: 'PERSONAL', contextId: user.id, isPrimary: true } });
      if (!existingCal) {
        await prisma.calendar.create({
          data: {
            name: mainName,
            contextType: 'PERSONAL',
            contextId: user.id,
            isPrimary: true,
            isSystem: true,
            isDeletable: false,
            defaultReminderMinutes: 10,
            members: { create: { userId: user.id, role: 'OWNER' } }
          }
        });
        await logger.info('Created personal primary calendar during registration', {
          operation: 'register_user',
          context: { userId: user.id, email: user.email, calendarName: mainName },
        });
      }
    } catch (e: unknown) {
      const err = e as Error;
      await logger.error('Failed to ensure personal main calendar on register', {
        operation: 'register_user',
        error: { message: err.message, stack: err.stack },
        context: { userId: user.id, email: user.email },
      });
      // Don't fail registration if calendar creation fails - it will be created when dashboard is created
    }

    res.status(201).json({ 
      token,
      refreshToken: refreshToken || '', // Return empty string if refresh token creation failed
      user: createUserResponse(user)
    });
  } catch (err: unknown) {
    // Log registration error (but don't fail if logging fails)
    try {
      await logger.error('User registration failed', {
        operation: 'user_registration',
        email: email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        }
      });
    } catch (logError: unknown) {
      logWhenLoggerFails('user_registration_logger', logError, err);
    }
    
    // Handle Prisma unique constraint violations (email already exists)
    if (typeof err === 'object' && err && 'code' in err && (err as Record<string, unknown>).code === 'P2002') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    // Handle database connection errors
    if (typeof err === 'object' && err && 'message' in err) {
      const errorMessage = (err as Record<string, unknown>).message as string;
      if (errorMessage.includes('connection pool') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('Can\'t reach database') ||
          errorMessage.includes('PrismaClientInitializationError')) {
        return res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
      }
    }
    
    // Generic error response
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
}));

app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, async (err: unknown, user: User | false, info: { message?: string } | undefined) => {
    if (err || !user) {
      // Check if it's a database connection error
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('Database connection failed') || 
          errorMessage.includes('Database temporarily unavailable')) {
        // Log database connection error
        try {
          await logger.logSecurityEvent('login_database_error', 'high', {
            operation: 'user_login',
            email: req.body.email,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            reason: 'Database connection failed'
          });
        } catch (logError: unknown) {
          logWhenLoggerFails('login_database_error_logger', logError);
        }
        return res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
      }
      
      // Log failed login attempt
      try {
        await logger.logSecurityEvent('login_failed', 'medium', {
          operation: 'user_login',
          email: req.body.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          reason: info?.message || 'Invalid credentials'
        });
      } catch (logError: unknown) {
        logWhenLoggerFails('login_failed_logger', logError);
      }
      
      return res.status(401).json({ message: info?.message || 'Unauthorized' });
    }
    
    // Log successful login
    await logger.logUserAction(user.id, 'user_login', {
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    const token = issueJWT(user);
    const refreshToken = await createRefreshToken(user.id);
    
    return res.json({ 
      token,
      refreshToken,
      user: createUserResponse(user)
    });
  })(req, res, next);
});

app.post('/api/auth/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const user = await validateRefreshToken(refreshToken);
  if (!user) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  // Delete the used refresh token
  await deleteRefreshToken(refreshToken);

  // Create new tokens
  const newToken = issueJWT(user);
  const newRefreshToken = await createRefreshToken(user.id);

  res.json({
    token: newToken,
    refreshToken: newRefreshToken,
    user: createUserResponse(user)
  });
}));

app.post('/api/auth/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!user) {
    // Don't reveal that the email doesn't exist
    return res.json({ message: 'If an account exists, a password reset email will be sent' });
  }

  const resetToken = await createPasswordResetToken(user.id);
  await sendPasswordResetEmail(user.email, resetToken);

  res.json({ message: 'If an account exists, a password reset email will be sent' });
}));

app.post('/api/auth/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  const user = await validatePasswordResetToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  await deletePasswordResetToken(token);
  await deleteAllUserRefreshTokens(user.id);

  res.json({ message: 'Password has been reset successfully' });
}));

app.post('/api/auth/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const user = await validateEmailVerificationToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() }
  });

  await deleteEmailVerificationToken(token);

  res.json({ message: 'Email verified successfully' });
}));

app.post('/api/auth/resend-verification', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const raw = typeof email === 'string' ? email.trim() : '';
  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return res.status(400).json({ message: 'A valid email address is required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: raw },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (user && !user.emailVerified) {
    const verificationToken = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(user.email, verificationToken);
  }

  // Uniform response — do not reveal whether the account exists or is already verified
  res.json({
    message:
      'If an account exists for this email and requires verification, instructions have been sent.',
  });
}));

// NextAuth.js internal logging endpoint
app.post('/api/auth/_log', (req: Request, res: Response) => {
  // Just return success for NextAuth.js internal logging
  res.status(200).json({ success: true });
});

// JWT authentication middleware - using imported function from middleware/auth

// Temporarily disabled due to type conflicts
// function requireRole(role: string) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (req.user && req.user.role === role) {
//       next();
//     } else {
//       res.status(403).json({ message: 'Forbidden' });
//     }
//   };
// }

// Example of a protected route
app.get('/api/profile', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/profile', authenticateJWT, async (req, res) => {
  try {
    const auth = req as AuthenticatedRequest;
    const userId = auth.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const rawName = (req.body as { name?: unknown })?.name;
    if (typeof rawName !== 'string' || !rawName.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: rawName.trim() },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        emailVerified: true,
        image: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
        userNumber: true,
        countryId: true,
        regionId: true,
        townId: true,
        locationDetectedAt: true,
        locationUpdatedAt: true,
        lastActiveAt: true,
      },
    });
    res.json({ user: updated });
  } catch (error: unknown) {
    const err = error as Error;
    void logger
      .error('PUT /api/profile failed', {
        operation: 'put_profile',
        error: { message: err.message, stack: err.stack },
      })
      .catch(() => undefined);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Example of an admin-only route
// Temporarily disabled due to type conflicts
// app.get('/api/admin', authenticateJWT, requireRole('ADMIN'), (req, res) => {
//   res.json({ message: 'Welcome, admin!' });
// });

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
app.use('/api/folder', folderRouter);
app.use('/api/chat', authenticateJWT, chatRouter);
app.use('/api/business', authenticateJWT, businessRouter);
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
app.use('/api/ai/autonomy', authenticateJWT, aiAutonomyRouter);
app.use('/api/ai/intelligence', authenticateJWT, aiIntelligenceRouter);
app.use('/api/ai/autonomous', authenticateJWT, aiAutonomousRouter);
app.use('/api/ai-stats', authenticateJWT, aiStatsRouter);
app.use('/api/ai/personality', authenticateJWT, aiPersonalityRouter);
app.use('/api/ai/patterns', authenticateJWT, aiPatternsRouter);
app.use('/api/ai/context', authenticateJWT, aiUserContextRouter);
app.use('/api/centralized-ai', authenticateJWT, aiCentralizedRouter);
app.use('/api/billing', authenticateJWT, billingRouter);
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
app.use('/api/ai-context-debug', aiContextDebugRouter);
app.use('/api/ai-conversations', authenticateJWT, aiConversationsRouter);
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

/** Failed deploys left this row in `_prisma_migrations`; Prisma then returns P3009 until resolved. */
const TAGS_MIGRATION_RECOVERY_NAME = '20260419203000_tasks_tags_not_null_default';

function shouldRecoverFailedTagsMigration(combinedOutput: string): boolean {
  if (!combinedOutput.includes(TAGS_MIGRATION_RECOVERY_NAME)) {
    return false;
  }
  return (
    combinedOutput.includes('P3009') ||
    combinedOutput.includes('P3018') ||
    combinedOutput.includes('migrate found failed migrations in the target database')
  );
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
  if (!first.ok && shouldRecoverFailedTagsMigration(first.combined)) {
    void logger
      .warn('Recovering failed tasks tags migration (resolve rolled-back, then redeploy)', {
        operation: 'prisma_migrate_recovery_tags',
        migration: TAGS_MIGRATION_RECOVERY_NAME,
      })
      .catch(() => undefined);

    const resolveResult = spawnPrisma(
      ['migrate', 'resolve', '--rolled-back', TAGS_MIGRATION_RECOVERY_NAME, '--schema', schemaPath],
      execOpts
    );
    if (!resolveResult.ok) {
      throw new Error(
        `prisma migrate resolve --rolled-back failed for ${TAGS_MIGRATION_RECOVERY_NAME}: ${resolveResult.combined}`
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
    await seedSchedulingModuleOnStartup();
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

  // Run reminder dispatcher every minute (MVP)
  try {
    cron.schedule('* * * * *', async () => {
      await dispatchDueReminders(5);
    });
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to schedule reminder dispatcher', {
      operation: 'cron_reminders',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Reset AI query allowances on the 1st of each month at midnight
  try {
    cron.schedule('0 0 1 * *', async () => {
      void logger.info('Running monthly AI query allowance reset', { operation: 'cron_ai_allowance_reset' }).catch(
        () => undefined
      );
      try {
        await AIQueryService.resetMonthlyAllowance();
        void logger.info('Monthly AI query allowance reset completed', {
          operation: 'cron_ai_allowance_reset',
        }).catch(() => undefined);
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error resetting AI query allowances', {
          operation: 'cron_ai_allowance_reset',
          error: { message: err.message, stack: err.stack },
        }).catch(() => undefined);
      }
    }, {
      timezone: 'America/New_York'
    });
    void logger.info('Monthly AI query allowance reset job scheduled', {
      operation: 'cron_ai_allowance_reset',
      schedule: '0 0 1 * * America/New_York',
    }).catch(() => undefined);
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to schedule AI query allowance reset job', {
      operation: 'cron_ai_allowance_reset',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Update developer small business eligibility on the 1st of each month at 1am
  try {
    const { RevenueSplitService } = await import('./services/revenueSplitService');
    cron.schedule('0 1 1 * *', async () => {
      void logger.info('Running monthly developer lifetime revenue calculation', {
        operation: 'cron_developer_revenue',
      }).catch(() => undefined);
      try {
        const result = await RevenueSplitService.updateAllModuleSmallBusinessEligibility();
        void logger.info('Developer lifetime revenue calculation completed', {
          operation: 'cron_developer_revenue',
          updated: result.updated,
          errors: result.errors,
        }).catch(() => undefined);
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error calculating developer lifetime revenue', {
          operation: 'cron_developer_revenue',
          error: { message: err.message, stack: err.stack },
        }).catch(() => undefined);
      }
    }, {
      timezone: 'America/New_York'
    });
    void logger.info('Monthly developer lifetime revenue job scheduled', {
      operation: 'cron_developer_revenue',
      schedule: '0 1 1 * * America/New_York',
    }).catch(() => undefined);
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to schedule developer lifetime revenue calculation job', {
      operation: 'cron_developer_revenue',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Process overage billing daily at 3am
  try {
    cron.schedule('0 3 * * *', async () => {
      void logger.info('Running daily overage billing processing', { operation: 'cron_overage_billing' }).catch(
        () => undefined
      );
      try {
        const result = await OverageBillingService.processAllOverageBilling();
        if (result.processed > 0) {
          void logger.info('Overage billing processed', {
            operation: 'cron_overage_billing',
            processed: result.processed,
            successful: result.successful,
            failed: result.failed,
            totalOverage: result.totalOverage,
          }).catch(() => undefined);
        } else {
          void logger.info('No subscriptions with ended billing periods (overage)', {
            operation: 'cron_overage_billing',
          }).catch(() => undefined);
        }
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error processing overage billing', {
          operation: 'cron_overage_billing',
          error: { message: err.message, stack: err.stack },
        }).catch(() => undefined);
      }
    }, {
      timezone: 'America/New_York'
    });
    void logger.info('Daily overage billing job scheduled', {
      operation: 'cron_overage_billing',
      schedule: '0 3 * * * America/New_York',
    }).catch(() => undefined);
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to schedule overage billing job', {
      operation: 'cron_overage_billing',
      error: { message: err.message, stack: err.stack },
    }).catch(() => undefined);
  }

  // Sync AI provider usage/expense data daily at 4am
  try {
    const { ProviderSyncService } = await import('./services/aiProviderServices/providerSyncService');
    const providerSyncService = new ProviderSyncService();

    cron.schedule('0 4 * * *', async () => {
      void logger.info('Running daily AI provider data sync', { operation: 'cron_ai_provider_sync' }).catch(
        () => undefined
      );
      try {
        await providerSyncService.syncProviderData();
        void logger.info('AI provider data sync completed', { operation: 'cron_ai_provider_sync' }).catch(
          () => undefined
        );
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error syncing AI provider data', {
          operation: 'cron_ai_provider_sync',
          error: { message: err.message, stack: err.stack },
        }).catch(() => undefined);
      }
    }, {
      timezone: 'America/New_York'
    });
    void logger.info('Daily AI provider data sync job scheduled', {
      operation: 'cron_ai_provider_sync',
      schedule: '0 4 * * * America/New_York',
    }).catch(() => undefined);

    providerSyncService.syncProviderData().catch((error: unknown) => {
      const err = error as Error;
      void logger.warn('Initial provider sync failed (non-critical)', {
        operation: 'ai_provider_sync_initial',
        error: { message: err.message, stack: err.stack },
      }).catch(() => undefined);
    });
  } catch (e: unknown) {
    const err = e as Error;
    void logger.error('Failed to schedule AI provider sync job', {
      operation: 'cron_ai_provider_sync',
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
