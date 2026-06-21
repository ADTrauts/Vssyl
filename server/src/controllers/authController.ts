import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { User } from '@prisma/client';
import { createRefreshToken } from '../utils/tokenUtils';
import { logger } from '../lib/logger';
import { logWhenLoggerFails } from '../lib/safeLoggerFallback';
import {
  AuthServiceError,
  registerWithSession,
  buildLoginResponse,
  refreshSession,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  mapRegistrationError,
  logRegistrationFailure,
} from '../services/account/authService';

function getClientIP(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded;
  return req.socket.remoteAddress;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }
  try {
    const result = await registerWithSession({
      email,
      password,
      name,
      clientIP: getClientIP(req),
      userAgent: req.get('user-agent'),
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    const mapped = mapRegistrationError(err);
    if (mapped) {
      const payload: Record<string, string> = { message: mapped.message };
      if (process.env.NODE_ENV === 'development' && mapped.statusCode === 503) {
        payload.error = mapped.message;
      }
      res.status(mapped.statusCode).json(payload);
      return;
    }
    await logRegistrationFailure(email, req.ip, req.get('user-agent'), err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      message: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage }),
    });
  }
}

export function login(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('local', { session: false }, async (err: unknown, user: User | false, info: { message?: string } | undefined) => {
    if (err || !user) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.includes('Database connection failed') ||
        errorMessage.includes('Database temporarily unavailable')
      ) {
        try {
          await logger.logSecurityEvent('login_database_error', 'high', {
            operation: 'user_login',
            email: (req.body as { email?: string }).email,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            reason: 'Database connection failed',
          });
        } catch (logError: unknown) {
          logWhenLoggerFails('login_database_error_logger', logError);
        }
        res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
        return;
      }
      try {
        await logger.logSecurityEvent('login_failed', 'medium', {
          operation: 'user_login',
          email: (req.body as { email?: string }).email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          reason: info?.message || 'Invalid credentials',
        });
      } catch (logError: unknown) {
        logWhenLoggerFails('login_failed_logger', logError);
      }
      res.status(401).json({ message: info?.message || 'Unauthorized' });
      return;
    }

    await logger.logUserAction(user.id, 'user_login', {
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const refreshToken = await createRefreshToken(user.id);
    res.json(buildLoginResponse(user, refreshToken));
  })(req, res, next);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }
  try {
    const result = await refreshSession(refreshToken);
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }
  const result = await forgotPassword(email);
  res.json(result);
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ message: 'Token and password are required' });
    return;
  }
  try {
    const result = await resetPassword(token, password);
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
}

export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }
  try {
    const result = await verifyEmail(token);
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
}

export async function resendVerificationHandler(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  try {
    const result = await resendVerification(email ?? '');
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: 'A valid email address is required' });
  }
}

export function authLog(req: Request, res: Response): void {
  res.status(200).json({ success: true });
}
