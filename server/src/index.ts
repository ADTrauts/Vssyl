import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

// Explicitly load .env from the server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import passport, { issueJWT, registerUser } from './auth';
import jwt from 'jsonwebtoken';
import type { User, Role } from '@prisma/client';
import { prisma } from './lib/prisma';
import dashboardRouter from './routes/dashboard';
import widgetRouter from './routes/widget';
import fileRouter from './routes/file';
import folderRouter from './routes/folder';
import driveRouter from './routes/drive';
import chatRouter from './routes/chat';
import businessRouter from './routes/business';
import educationalRouter from './routes/educational';
import householdRouter from './routes/household';
import ssoRouter from './routes/sso';
import googleOAuthRouter from './routes/googleOAuth';
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
import { initializeChatSocketService } from './services/chatSocketService';
import cron from 'node-cron';
import { dispatchDueReminders } from './services/reminderService';
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
import aiAutonomyRouter from './routes/ai-autonomy';
import aiIntelligenceRouter from './routes/ai-intelligence';
import aiCentralizedRouter from './routes/ai-centralized';
import billingRouter from './routes/billing';
import featureGatingRouter from './routes/featureGating';
import featuresRouter from './routes/features';
import paymentRouter from './routes/payment';
import developerPortalRouter from './routes/developerPortal';
import locationRouter from './routes/location';
import adminRouter from './routes/admin';
import adminPortalRouter from './routes/admin-portal';
import calendarRouter from './routes/calendar';
import orgChartRouter from './routes/org-chart';
import businessAIRouter from './routes/businessAI';
import adminBusinessAIRouter from './routes/adminBusinessAI';
import aiContextDebugRouter from './routes/ai-context-debug';
import { authenticateJWT } from './middleware/auth';



const app: express.Application = express();
const port = process.env.PORT || 5000;



// Helper function to create user response
function createUserResponse(user: User) {
  const { password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    emailVerified: !!user.emailVerified,
  };
}

// Helper to wrap async route handlers for Express
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

console.log('Starting server...');

app.use(express.json());
app.use(passport.initialize() as express.RequestHandler);
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add general request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.originalUrl}`);
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
    
    const user = await registerUser(email, password, name, clientIP as string);
    
    // In development mode, auto-verify email and skip email sending
    if (process.env.NODE_ENV === 'development') {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      });
    } else {
      // Create and send verification email
      const verificationToken = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, verificationToken);
      
      // Send welcome email
      await sendWelcomeEmail(user.email, user.name || 'there');
    }
    
    const token = issueJWT(user);
    const refreshToken = await createRefreshToken(user.id);

    // Ensure a personal main calendar exists named after the first tab (use "My Dashboard" as fallback)
    try {
      // Find or create the user's first personal dashboard name
      const personalDash = await prisma.dashboard.findFirst({
        where: { userId: user.id, businessId: null, institutionId: null, householdId: null },
        orderBy: { createdAt: 'asc' }
      });
      const mainName = personalDash?.name || 'My Dashboard';
      const existingCal = await prisma.calendar.findFirst({ where: { contextType: 'PERSONAL' as any, contextId: user.id, isPrimary: true } });
      if (!existingCal) {
        await prisma.calendar.create({
          data: {
            name: mainName,
            contextType: 'PERSONAL' as any,
            contextId: user.id,
            isPrimary: true,
            isSystem: true,
            isDeletable: false,
            defaultReminderMinutes: 10,
            members: { create: { userId: user.id, role: 'OWNER' } }
          }
        });
      }
    } catch (e) {
      console.error('Failed to ensure personal main calendar on register:', e);
    }

    res.status(201).json({ 
      token,
      refreshToken,
      user: createUserResponse(user)
    });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as Record<string, unknown>).code === 'P2002') {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    throw err;
  }
}));

app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, async (err: unknown, user: User | false, info: { message?: string } | undefined) => {
    if (err || !user) {
      return res.status(401).json({ message: info?.message || 'Unauthorized' });
    }
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
      updatedAt: true,
      emailVerified: true,
    }
  });
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  const verificationToken = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(user.email, verificationToken);

  res.json({ message: 'Verification email sent' });
}));

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

// Example of an admin-only route
// Temporarily disabled due to type conflicts
// app.get('/api/admin', authenticateJWT, requireRole('ADMIN'), (req, res) => {
//   res.json({ message: 'Welcome, admin!' });
// });

app.use('/api/dashboard', authenticateJWT, dashboardRouter);
app.use('/api/widget', authenticateJWT, widgetRouter);
console.log('[DEBUG] Registering /api/drive route');
app.use('/api/drive', authenticateJWT, driveRouter);
app.use('/api/folder', folderRouter);
app.use('/api/chat', authenticateJWT, chatRouter);
app.use('/api/business', authenticateJWT, businessRouter);
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
app.use('/api/ai/autonomy', aiAutonomyRouter);
app.use('/api/ai/intelligence', aiIntelligenceRouter);
app.use('/api/centralized-ai', aiCentralizedRouter);
app.use('/api/billing', authenticateJWT, billingRouter);
app.use('/api/feature-gating', authenticateJWT, featureGatingRouter);
app.use('/api/features', authenticateJWT, featuresRouter);
app.use('/api/payment', authenticateJWT, paymentRouter);
app.use('/api/developer', authenticateJWT, developerPortalRouter);
app.use('/api/location', locationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin-portal', adminPortalRouter);
app.use('/api/org-chart', orgChartRouter);
app.use('/api/calendar', authenticateJWT, calendarRouter);
app.use('/api/business-ai', businessAIRouter);
app.use('/api/admin/business-ai', adminBusinessAIRouter);
app.use('/api/ai-context-debug', aiContextDebugRouter);

// Schedule cleanup jobs
startCleanupJob();

// Generic catch-all for unhandled routes
app.use((req: Request, res: Response) => {
  console.log(`[DEBUG] Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Not Found' });
});

const isProd = process.env.NODE_ENV === 'production';

// Centralized error-handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string | number;
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Ensure we always have an Error object to work with
  const error = (err instanceof Error ? err : new Error(String(err))) as ErrorWithStatus;

  const status = error.status || 500;
  const response: { message: string; error?: string; code?: string | number } = {
    message: error.message || 'Internal Server Error',
  };

  if (!isProd && error.stack) {
    response.error = error.stack;
  } else if (error.code) {
    response.code = error.code;
  }
  // Log error in development
  if (!isProd) {
    console.error(err);
  }

  res.status(status).json(response);
});

// Initialize HTTP server
const httpServer = createServer(app);

// Initialize WebSocket service
initializeChatSocketService(httpServer);

// Create HTTP server and initialize WebSocket service
const server = httpServer.listen(port, () => {
  console.log(`About to listen on port ${port}`);
}).on('listening', () => {
  console.log(`Server listening on port ${port}`);
  // Run reminder dispatcher every minute (MVP)
  try {
    cron.schedule('* * * * *', async () => {
      await dispatchDueReminders(5);
    });
  } catch (e) {
    console.error('Failed to schedule reminder dispatcher:', e);
  }
}).on('error', (err) => {
  console.error('Server startup error:', err);
});

export default app;
