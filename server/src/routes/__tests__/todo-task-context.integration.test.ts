import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import todoRouter from '../todo';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createTodoTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/todo', todoRouter);
  return app;
}

describe('Todo task create — dashboard binding (F-038)', () => {
  const app = createTodoTestApp();
  const userIdsToCleanup: string[] = [];

  let owner: User;
  let other: User;
  let ownerDashboardId: string;
  let otherDashboardId: string;

  beforeAll(async () => {
    owner = await createTestUser({ name: 'Todo Context Owner' });
    other = await createTestUser({ name: 'Todo Context Other' });
    userIdsToCleanup.push(owner.id, other.id);

    const ownerDash = await prisma.dashboard.create({
      data: { userId: owner.id, name: 'Owner dash' },
    });
    ownerDashboardId = ownerDash.id;

    const otherDash = await prisma.dashboard.create({
      data: { userId: other.id, name: 'Other dash' },
    });
    otherDashboardId = otherDash.id;
  });

  afterAll(async () => {
    await prisma.dashboard.deleteMany({
      where: { id: { in: [ownerDashboardId, otherDashboardId] } },
    });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 404 when dashboard is not owned by the caller', async () => {
    const res = await request(app)
      .post('/api/todo/tasks')
      .set(createAuthHeader(owner))
      .send({
        title: 'Leak attempt',
        dashboardId: otherDashboardId,
      });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Dashboard not found' });
  });

  it('returns 400 when business/household ids do not match the dashboard', async () => {
    const res = await request(app)
      .post('/api/todo/tasks')
      .set(createAuthHeader(owner))
      .send({
        title: 'Mismatch',
        dashboardId: ownerDashboardId,
        businessId: '00000000-0000-4000-8000-000000000001',
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'Dashboard does not match business or household context',
    });
  });

  it('returns 201 when dashboard is owned and context matches', async () => {
    const res = await request(app)
      .post('/api/todo/tasks')
      .set(createAuthHeader(owner))
      .send({
        title: 'Valid task',
        dashboardId: ownerDashboardId,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Valid task');

    await prisma.task.deleteMany({ where: { dashboardId: ownerDashboardId } });
  });
});
