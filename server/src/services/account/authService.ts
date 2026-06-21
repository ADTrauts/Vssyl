import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { issueJWT, registerUser } from '../../auth';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { logWhenLoggerFails } from '../../lib/safeLoggerFallback';
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
  deleteAllUserRefreshTokens,
} from '../../utils/tokenUtils';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../emailService';
import { createUserResponse } from './userResponse';

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002';
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'P1001' || code === 'P1002') return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database") ||
    message.includes('connection pool') ||
    message.includes('timeout') ||
    message.includes('PrismaClientInitializationError') ||
    message.includes('P1001') ||
    message.includes('P1002')
  );
}

async function ensurePersonalPrimaryCalendar(user: User, mainName?: string): Promise<void> {
  try {
    const personalDash = await prisma.dashboard.findFirst({
      where: { userId: user.id, businessId: null, institutionId: null, householdId: null },
      orderBy: { createdAt: 'asc' },
    });
    const calendarName = mainName ?? personalDash?.name ?? 'My Dashboard';
    const existingCal = await prisma.calendar.findFirst({
      where: { contextType: 'PERSONAL', contextId: user.id, isPrimary: true },
    });
    if (!existingCal) {
      await prisma.calendar.create({
        data: {
          name: calendarName,
          contextType: 'PERSONAL',
          contextId: user.id,
          isPrimary: true,
          isSystem: true,
          isDeletable: false,
          defaultReminderMinutes: 10,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
      await logger.info('Created personal primary calendar during registration', {
        operation: 'register_user',
        context: { userId: user.id, email: user.email, calendarName },
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to ensure personal main calendar on register', {
      operation: 'register_user',
      error: { message: err.message, stack: err.stack },
      context: { userId: user.id, email: user.email },
    });
  }
}

async function handlePostRegistrationEmail(user: User): Promise<void> {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const verificationToken = await createEmailVerificationToken(user.id);
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError: unknown) {
        await logger.warn('Failed to send verification email during registration', {
          operation: 'user_registration',
          userId: user.id,
          email: user.email,
          error: {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined,
          },
        });
      }
      try {
        await sendWelcomeEmail(user.email, user.name || 'there');
      } catch (welcomeEmailError: unknown) {
        await logger.warn('Failed to send welcome email during registration', {
          operation: 'user_registration',
          userId: user.id,
          email: user.email,
          error: {
            message: welcomeEmailError instanceof Error ? welcomeEmailError.message : 'Unknown error',
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }
  } catch (emailConfigError: unknown) {
    await logger.warn('Email configuration error during registration, auto-verifying email', {
      operation: 'user_registration',
      userId: user.id,
      email: user.email,
      error: {
        message: emailConfigError instanceof Error ? emailConfigError.message : 'Unknown error',
      },
    });
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    } catch (updateError: unknown) {
      await logger.error('Failed to auto-verify email during registration', {
        operation: 'user_registration',
        userId: user.id,
        error: {
          message: updateError instanceof Error ? updateError.message : 'Unknown error',
        },
      });
    }
  }
}

export async function registerWithSession(params: {
  email: string;
  password: string;
  name?: string;
  clientIP?: string;
  userAgent?: string;
}): Promise<{ token: string; refreshToken: string; user: ReturnType<typeof createUserResponse> }> {
  const { email, password, name, clientIP, userAgent } = params;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbTestError: unknown) {
    const dbErrorMsg = dbTestError instanceof Error ? dbTestError.message : 'Unknown error';
    void logger.error('Registration database connection test failed', {
      operation: 'user_registration',
      error: { message: dbErrorMsg },
    }).catch(() => undefined);
    throw new AuthServiceError('Database connection failed. Please try again later.', 503);
  }

  let user: User;
  try {
    user = await registerUser(email, password, name, clientIP);
  } catch (registerError: unknown) {
    if (isPrismaUniqueViolation(registerError)) {
      throw new AuthServiceError('Email already in use', 409);
    }
    if (isDatabaseUnavailable(registerError)) {
      throw new AuthServiceError('Database temporarily unavailable. Please try again.', 503);
    }
    const errorMessage = registerError instanceof Error ? registerError.message : 'Unknown error';
    try {
      await logger.error('User registration failed in registerUser function', {
        operation: 'user_registration',
        email,
        ipAddress: clientIP,
        userAgent,
        error: {
          message: errorMessage,
          stack: registerError instanceof Error ? registerError.stack : undefined,
        },
      });
    } catch (logError: unknown) {
      console.error('Failed to log registration error:', logError);
      console.error('Original registration error:', registerError);
    }
    throw registerError;
  }

  try {
    await logger.logUserAction(user.id, 'user_registered', {
      email: user.email,
      ipAddress: clientIP,
      userAgent,
    });
  } catch (logError: unknown) {
    console.error('Failed to log user action during registration:', logError);
  }

  await handlePostRegistrationEmail(user);

  const token = issueJWT(user);
  let refreshToken = '';
  try {
    refreshToken = await createRefreshToken(user.id);
  } catch (refreshTokenError: unknown) {
    await logger.error('Failed to create refresh token during registration', {
      operation: 'user_registration',
      userId: user.id,
      error: {
        message: refreshTokenError instanceof Error ? refreshTokenError.message : 'Unknown error',
        stack: refreshTokenError instanceof Error ? refreshTokenError.stack : undefined,
      },
    });
  }

  await ensurePersonalPrimaryCalendar(user);

  return {
    token,
    refreshToken,
    user: createUserResponse(user),
  };
}

export function buildLoginResponse(user: User, refreshToken: string) {
  return {
    token: issueJWT(user),
    refreshToken,
    user: createUserResponse(user),
  };
}

export async function refreshSession(refreshToken: string) {
  const user = await validateRefreshToken(refreshToken);
  if (!user) {
    throw new AuthServiceError('Invalid refresh token', 401);
  }
  await deleteRefreshToken(refreshToken);
  const newToken = issueJWT(user);
  const newRefreshToken = await createRefreshToken(user.id);
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user: createUserResponse(user),
  };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (user) {
    const resetToken = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, resetToken);
  }
  return { message: 'If an account exists, a password reset email will be sent' };
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const user = await validatePasswordResetToken(token);
  if (!user) {
    throw new AuthServiceError('Invalid or expired reset token', 400);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  await deletePasswordResetToken(token);
  await deleteAllUserRefreshTokens(user.id);
  return { message: 'Password has been reset successfully' };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const user = await validateEmailVerificationToken(token);
  if (!user) {
    throw new AuthServiceError('Invalid or expired verification token', 400);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
  await deleteEmailVerificationToken(token);
  return { message: 'Email verified successfully' };
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const raw = email.trim();
  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    throw new AuthServiceError('A valid email address is required', 400);
  }
  const user = await prisma.user.findUnique({
    where: { email: raw },
    select: { id: true, email: true, emailVerified: true },
  });
  if (user && !user.emailVerified) {
    const verificationToken = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(user.email, verificationToken);
  }
  return {
    message:
      'If an account exists for this email and requires verification, instructions have been sent.',
  };
}

export function mapRegistrationError(err: unknown): AuthServiceError | null {
  if (err instanceof AuthServiceError) return err;
  if (isPrismaUniqueViolation(err)) {
    return new AuthServiceError('Email already in use', 409);
  }
  if (isDatabaseUnavailable(err)) {
    return new AuthServiceError('Database temporarily unavailable. Please try again.', 503);
  }
  return null;
}

export async function logRegistrationFailure(
  email: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  err: unknown
): Promise<void> {
  try {
    await logger.error('User registration failed', {
      operation: 'user_registration',
      email,
      ipAddress,
      userAgent,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      },
    });
  } catch (logError: unknown) {
    logWhenLoggerFails('user_registration_logger', logError, err);
  }
}
