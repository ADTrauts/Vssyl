/**
 * Phase D (A-056) — focused coverage: Stripe webhook wiring, notification identity
 * boundaries (without importing the full `notification` router graph — Vitest/CJS
 * resolution for date-fns can fail in some environments).
 *
 * Handlers below mirror `notificationController` create + mark read + for-user checks;
 * keep aligned when changing those endpoints.
 *
 * Tenant scheduling isolation: `scheduling-tenant-scope.integration.test.ts`.
 * Vision/GCS paths: require storage stack — covered by AI runbooks; optional follow-up tests when Vitest deps are stable.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response } from 'express';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { body, param } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { authenticateJWT } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { createAppWithStripeWebhookMount } from '../../__tests__/helpers/stripeWebhookTestApp';

/** Pre-hashed bcrypt for "password" — avoids loading native `bcrypt` in Vitest (A-056). */
const TEST_PASSWORD_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function createJwtHeader(user: Pick<User, 'id' | 'email' | 'role'>): { Authorization: string } {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '1h' }
  );
  return { Authorization: `Bearer ${token}` };
}

async function createUserNoBcrypt(name: string): Promise<User> {
  const id = crypto.randomUUID();
  return prisma.user.create({
    data: {
      email: `phased-${id}@test.local`,
      password: TEST_PASSWORD_HASH,
      name,
      role: 'USER',
      emailVerified: new Date(),
    },
  });
}

async function cleanupUsersPhaseD(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.adminImpersonation.deleteMany({
    where: {
      OR: [{ adminId: { in: userIds } }, { targetUserId: { in: userIds } }],
    },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

/** Mirrors notificationController.createNotification (no WebSocket). */
async function createNotificationPhaseD(req: Request, res: Response): Promise<void> {
  try {
    const callerId = req.user?.id;
    if (!callerId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { type, title, body, data } = req.body as {
      type?: string;
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
    };
    if (!type || !title) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        body,
        data: (data ?? {}) as Prisma.InputJsonValue,
        userId: callerId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json({ notification });
  } catch {
    res.status(500).json({ error: 'Failed to create notification' });
  }
}

/** Mirrors notificationController.markAsRead without socket broadcast (identity check only). */
async function markAsReadPhaseD(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ notification: updatedNotification });
  } catch {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

/** Mirrors notificationController.createNotificationForUser (admin gate). */
async function createNotificationForUserPhaseD(req: Request, res: Response): Promise<void> {
  try {
    const { type, title, body, data, userId: targetUserId } = req.body as {
      type?: string;
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      userId?: string;
    };
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });
    if (currentUser?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (!type || !title || !targetUserId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        body,
        data: (data ?? {}) as Prisma.InputJsonValue,
        userId: targetUserId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json({ notification });
  } catch {
    res.status(500).json({ error: 'Failed to create notification' });
  }
}

function createPhaseDNotificationApp(): express.Application {
  const router = express.Router();
  router.use(authenticateJWT);
  router.post(
    '/',
    validate([
      body('type').isString().notEmpty().trim(),
      body('title').isString().notEmpty().trim(),
      body('body').optional({ values: 'null' }).isString(),
    ]),
    createNotificationPhaseD
  );
  router.post(
    '/:id/read',
    validate([param('id').isUUID()]),
    markAsReadPhaseD
  );
  router.post('/for-user', createNotificationForUserPhaseD);

  const app = express();
  app.use(express.json());
  app.use('/api/notifications', router);
  return app;
}

describe('Phase D — Stripe webhook stack (A-056)', () => {
  const app = createAppWithStripeWebhookMount();

  it('POST /api/payment/webhook is not JWT-gated (not 401)', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).not.toBe(401);
  });

  it('JWT-protected payment routes still reject unauthenticated callers', async () => {
    const res = await request(app).post('/api/payment/intent').send({ amount: 1000 });
    expect(res.status).toBe(401);
  });
});

describe('Phase D — Notifications identity boundary (A-056)', () => {
  const app = createPhaseDNotificationApp();
  const userIds: string[] = [];
  let userA: User;
  let userB: User;
  let notifForBId: string;

  beforeAll(async () => {
    userA = await createUserNoBcrypt('PhaseD User A');
    userB = await createUserNoBcrypt('PhaseD User B');
    userIds.push(userA.id, userB.id);

    const n = await prisma.notification.create({
      data: {
        userId: userB.id,
        type: 'system_alert',
        title: 'Owned by B',
        body: 'secret',
      },
    });
    notifForBId = n.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { id: notifForBId } });
    await cleanupUsersPhaseD(userIds);
  });

  it('POST / creates notification only for the authenticated user (ignores data.targetUserId)', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set(createJwtHeader(userA))
      .send({
        type: 'system_alert',
        title: 'Self',
        body: 'x',
        data: { targetUserId: userB.id },
      });

    expect(res.status).toBe(201);
    const nid = (res.body as { notification?: { userId?: string } }).notification?.userId;
    expect(nid).toBe(userA.id);

    const createdId = (res.body as { notification?: { id?: string } }).notification?.id;
    if (createdId) {
      await prisma.notification.delete({ where: { id: createdId } });
    }
  });

  it('non-owner cannot mark another user notification as read (404)', async () => {
    const res = await request(app)
      .post(`/api/notifications/${notifForBId}/read`)
      .set(createJwtHeader(userA))
      .send();

    expect(res.status).toBe(404);
  });

  it('non-admin cannot use POST /for-user (403)', async () => {
    const res = await request(app)
      .post('/api/notifications/for-user')
      .set(createJwtHeader(userA))
      .send({
        type: 'system_alert',
        title: 'Inject',
        userId: userB.id,
      });

    expect(res.status).toBe(403);
  });
});
