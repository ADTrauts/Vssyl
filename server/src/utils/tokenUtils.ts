import crypto from 'crypto';
import { addDays, addHours } from 'date-fns';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

// JWT Payload interface
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Calendar RSVP token payload
interface CalendarRsvpPayload {
  eventId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = addDays(new Date(), 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function createPasswordResetToken(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addHours(new Date(), 1); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function createEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addDays(new Date(), 1); // 1 day

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function validateRefreshToken(token: string) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    return null;
  }

  return refreshToken.user;
}

export async function validatePasswordResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return null;
  }

  return resetToken.user;
}

export async function validateEmailVerificationToken(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return null;
  }

  return verificationToken.user;
}

export async function createRsvpToken(eventId: string, attendeeEmail: string, response: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addDays(new Date(), 7); // 7 days for RSVP link validity
  
  await prisma.rsvpToken.create({
    data: {
      token,
      eventId,
      attendeeEmail,
      response,
      expiresAt,
    },
  });
  
  return token;
}

export async function validateRsvpToken(token: string) {
  const rsvpToken = await prisma.rsvpToken.findUnique({
    where: { token },
    include: { event: true },
  });
  
  if (!rsvpToken || rsvpToken.expiresAt < new Date()) {
    return null;
  }
  
  return rsvpToken;
}

export async function deleteRefreshToken(token: string) {
  await prisma.refreshToken.delete({
    where: { token },
  });
}

export async function deletePasswordResetToken(token: string) {
  await prisma.passwordResetToken.delete({
    where: { token },
  });
}

export async function deleteEmailVerificationToken(token: string) {
  await prisma.emailVerificationToken.delete({
    where: { token },
  });
}

export async function deleteAllUserRefreshTokens(userId: string) {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

export async function deleteAllUserPasswordResetTokens(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });
}

export async function deleteAllUserEmailVerificationTokens(userId: string) {
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });
} 

// Calendar RSVP tokens (JWT-based, short-lived)
export function createCalendarRsvpToken(eventId: string, email: string, expiresInHours: number = 168): string {
  const payload = { eventId, email };
  const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: `${expiresInHours}h` });
  return token;
}

export function verifyCalendarRsvpToken(token: string): { eventId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as CalendarRsvpPayload;
    return { eventId: decoded.eventId, email: decoded.email };
  } catch {
    return null;
  }
}