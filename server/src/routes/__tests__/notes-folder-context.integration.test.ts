import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import notesRouter from '../notes';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createNotesApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/notes', notesRouter);
  return app;
}

describe('Notes folders — dashboard binding (F-039)', () => {
  const app = createNotesApp();
  const userIdsToCleanup: string[] = [];
  let owner: User;
  let other: User;
  let ownerDash: string;
  let otherDash: string;

  beforeAll(async () => {
    owner = await createTestUser({ name: 'Notes Folder Owner' });
    other = await createTestUser({ name: 'Notes Folder Other' });
    userIdsToCleanup.push(owner.id, other.id);

    const a = await prisma.dashboard.create({
      data: { userId: owner.id, name: 'Owner notes dash' },
    });
    ownerDash = a.id;
    const b = await prisma.dashboard.create({
      data: { userId: other.id, name: 'Other notes dash' },
    });
    otherDash = b.id;
  });

  afterAll(async () => {
    await prisma.noteFolder.deleteMany({ where: { dashboardId: { in: [ownerDash, otherDash] } } });
    await prisma.dashboard.deleteMany({ where: { id: { in: [ownerDash, otherDash] } } });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 404 when listing folders for another user dashboard', async () => {
    const res = await request(app)
      .get(`/api/notes/folders?dashboardId=${otherDash}`)
      .set(createAuthHeader(owner));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Dashboard not found' });
  });

  it('returns 400 when businessId does not match the dashboard', async () => {
    const res = await request(app)
      .post('/api/notes/folders')
      .set(createAuthHeader(owner))
      .send({
        name: 'Bad ctx',
        dashboardId: ownerDash,
        businessId: '00000000-0000-4000-8000-000000000001',
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Dashboard does not match business context' });
  });
});
