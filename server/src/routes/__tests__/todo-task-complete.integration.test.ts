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

describe('Todo task complete/reopen — access control (A-031)', () => {
  const app = createTodoTestApp();
  const userIdsToCleanup: string[] = [];
  let owner: User;
  let other: User;
  let dashboardId: string;
  let taskId: string;

  beforeAll(async () => {
    owner = await createTestUser({ name: 'Todo Owner' });
    other = await createTestUser({ name: 'Todo Stranger' });
    userIdsToCleanup.push(owner.id, other.id);

    const dashboard = await prisma.dashboard.create({
      data: {
        userId: owner.id,
        name: 'Todo test dashboard',
      },
    });
    dashboardId = dashboard.id;

    const task = await prisma.task.create({
      data: {
        title: 'Secret task',
        dashboardId,
        createdById: owner.id,
        status: 'TODO',
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { dashboardId } });
    await prisma.dashboard.deleteMany({ where: { id: dashboardId } });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 404 when a non-owner non-assignee tries to complete a task', async () => {
    const res = await request(app)
      .post(`/api/todo/tasks/${taskId}/complete`)
      .set(createAuthHeader(other));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Task not found' });

    const unchanged = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, completedAt: true },
    });
    expect(unchanged?.status).toBe('TODO');
    expect(unchanged?.completedAt).toBeNull();
  });

  it('allows creator to complete and reopen', async () => {
    const completeRes = await request(app)
      .post(`/api/todo/tasks/${taskId}/complete`)
      .set(createAuthHeader(owner));
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('DONE');

    const reopenRes = await request(app)
      .post(`/api/todo/tasks/${taskId}/reopen`)
      .set(createAuthHeader(owner))
      .send({ status: 'TODO' });
    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.status).toBe('TODO');
  });
});
