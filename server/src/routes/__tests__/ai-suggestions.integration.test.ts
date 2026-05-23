import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import aiRouter from '../ai';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createSuggestionsTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', authenticateJWT, aiRouter);
  return app;
}

describe('Ambient suggestions HTTP routes (Phase 5A integration)', () => {
  const app = createSuggestionsTestApp();
  const userIdsToCleanup: string[] = [];
  const suggestionIds: string[] = [];
  let owner: User;
  let other: User;
  let ownerAuth: { Authorization: string };
  let otherAuth: { Authorization: string };
  let ownerDash: string;
  let otherDash: string;

  beforeAll(async () => {
    owner = await createTestUser({ name: 'Suggestion Owner' });
    other = await createTestUser({ name: 'Suggestion Other' });
    userIdsToCleanup.push(owner.id, other.id);
    ownerAuth = createAuthHeader(owner);
    otherAuth = createAuthHeader(other);

    const ownerDashboard = await prisma.dashboard.create({
      data: { userId: owner.id, name: 'Owner dash' },
    });
    ownerDash = ownerDashboard.id;
    const otherDashboard = await prisma.dashboard.create({
      data: { userId: other.id, name: 'Other dash' },
    });
    otherDash = otherDashboard.id;

    const ownerSuggestion = await prisma.aISuggestion.create({
      data: {
        userId: owner.id,
        dashboardId: ownerDash,
        type: 'document_upload',
        suggestionType: 'document_upload',
        title: 'Owner doc',
        body: 'Review your document',
        actionData: { fileId: 'file-owner' },
        status: 'PENDING',
        explainability: {
          summary: 'Test owner suggestion',
          contextUsed: [{ moduleId: 'drive', reason: 'upload' }],
          correlationReason: 'document_upload_v1',
          sourceEventIds: [],
        },
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    suggestionIds.push(ownerSuggestion.id);

    const otherSuggestion = await prisma.aISuggestion.create({
      data: {
        userId: other.id,
        dashboardId: otherDash,
        type: 'document_upload',
        suggestionType: 'document_upload',
        title: 'Other doc',
        body: 'Other user document',
        actionData: { fileId: 'file-other' },
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    suggestionIds.push(otherSuggestion.id);
  });

  afterAll(async () => {
    await prisma.aISuggestionFeedback.deleteMany({
      where: { suggestionId: { in: suggestionIds } },
    });
    await prisma.aISuggestion.deleteMany({ where: { id: { in: suggestionIds } } });
    await prisma.dashboard.deleteMany({ where: { id: { in: [ownerDash, otherDash] } } });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('lists only the authenticated user pending suggestions', async () => {
    const res = await request(app).get('/api/ai/suggestions').set(ownerAuth).expect(200);
    expect(res.body.success).toBe(true);
    const ids = (res.body.data as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toContain(suggestionIds[0]);
    expect(ids).not.toContain(suggestionIds[1]);
  });

  it('scopes list by dashboardId for owner', async () => {
    const res = await request(app)
      .get(`/api/ai/suggestions?dashboardId=${ownerDash}`)
      .set(ownerAuth)
      .expect(200);
    const ids = (res.body.data as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toContain(suggestionIds[0]);
  });

  it('rejects listing with another user dashboardId', async () => {
    await request(app)
      .get(`/api/ai/suggestions?dashboardId=${otherDash}`)
      .set(ownerAuth)
      .expect(400);
  });

  it('returns explain payload for own suggestion', async () => {
    const res = await request(app)
      .get(`/api/ai/suggestions/${suggestionIds[0]}`)
      .set(ownerAuth)
      .expect(200);
    expect(res.body.data.explain?.summary).toBe('Test owner suggestion');
  });

  it('cannot fetch another user suggestion by id', async () => {
    await request(app).get(`/api/ai/suggestions/${suggestionIds[1]}`).set(ownerAuth).expect(404);
  });

  it('cannot accept another user suggestion', async () => {
    await request(app)
      .post(`/api/ai/suggestions/${suggestionIds[1]}/accept`)
      .set(ownerAuth)
      .expect(404);
  });

  it('owner can dismiss own suggestion', async () => {
    const expiredSuggestion = await prisma.aISuggestion.create({
      data: {
        userId: owner.id,
        dashboardId: ownerDash,
        type: 'document_upload',
        suggestionType: 'document_upload',
        title: 'Dismiss me',
        body: 'Dismiss test',
        actionData: {},
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    suggestionIds.push(expiredSuggestion.id);

    const res = await request(app)
      .post(`/api/ai/suggestions/${expiredSuggestion.id}/dismiss`)
      .set(ownerAuth)
      .send({ doNotShowAgain: true, reason: 'test' })
      .expect(200);

    expect(res.body.data.suggestionId).toBe(expiredSuggestion.id);
    const updated = await prisma.aISuggestion.findUnique({ where: { id: expiredSuggestion.id } });
    expect(updated?.status).toBe('DISMISSED');
  });
});
