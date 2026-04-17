import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import * as activityFeedController from '../../controllers/activityFeedController';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createActivityFeedApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.get(
    '/api/activity-feed',
    authenticateJWT,
    (req, res, next) => {
      void activityFeedController.getActivityFeed(req, res).catch(next);
    }
  );
  return app;
}

describe('Activity feed dashboard scoping (F-032)', () => {
  const app = createActivityFeedApp();
  const userIdsToCleanup: string[] = [];
  let user: User;
  let dashboardId: string;
  let stranger: User;

  beforeAll(async () => {
    user = await createTestUser({ name: 'Activity Feed User' });
    stranger = await createTestUser({ name: 'Activity Feed Stranger' });
    userIdsToCleanup.push(user.id, stranger.id);

    const d = await prisma.dashboard.create({
      data: { userId: user.id, name: 'AF test dash' },
    });
    dashboardId = d.id;
  });

  afterAll(async () => {
    await prisma.dashboard.deleteMany({ where: { id: dashboardId } });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 404 when dashboardId is not owned by the user', async () => {
    const res = await request(app)
      .get(`/api/activity-feed?dashboardId=${dashboardId}`)
      .set(createAuthHeader(stranger));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Dashboard not found' });
  });

  it('returns 200 for owned dashboard', async () => {
    const res = await request(app)
      .get(`/api/activity-feed?dashboardId=${dashboardId}`)
      .set(createAuthHeader(user));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });
});
