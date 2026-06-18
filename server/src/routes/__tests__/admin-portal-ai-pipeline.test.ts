import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

describe('admin-portal AI Pipeline routes (0D-E / AP-F-030)', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('GET /ai-pipeline/catalog returns catalog for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/catalog')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveProperty('intents');
  });

  it('GET /ai-pipeline/registry/graph returns graph for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/registry/graph')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('nodes');
  });

  it('GET /ai-pipeline/diagnostics returns trace list for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/diagnostics')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('traces');
    expect(Array.isArray(response.body.data.traces)).toBe(true);
  });

  it('GET /ai-pipeline/quality/stats returns stats for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/quality/stats')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeDefined();
  });

  it('GET /ai-pipeline/retention returns retention settings for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/retention')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeDefined();
  });

  it('GET /ai-pipeline/suggestions/metrics returns funnel metrics for admin', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/suggestions/metrics')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeDefined();
  });

  it('rejects non-admin from pipeline catalog', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/catalog')
      .set(createAuthHeader(regularUser))
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('rejects unauthenticated pipeline diagnostics', async () => {
    const response = await request(app)
      .get('/api/admin-portal/ai-pipeline/diagnostics')
      .expect(401);

    expect(response.body).toHaveProperty('message', 'Access token required');
  });
});
