import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { requireAdmin } from '../admin-portal/adminPortalShared';
import { centralizedAiDeprecatedMiddleware } from '../../middleware/centralizedAiFence';
import aiCentralizedRouter from '../ai-centralized';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function createCentralizedAiTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/centralized-ai',
    authenticateJWT,
    requireAdmin,
    centralizedAiDeprecatedMiddleware,
    aiCentralizedRouter
  );
  return app;
}

describe('centralized-ai admin fence (Wave 1D)', () => {
  const app = createCentralizedAiTestApp();
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

  it('mounts requireAdmin on centralized-ai in server index', () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).toMatch(/\/api\/centralized-ai[\s\S]*requireAdmin/);
    expect(indexSource).toMatch(/centralizedAiDeprecatedMiddleware/);
  });

  it('blocks non-admin from centralized-ai routes', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/health')
      .set(createAuthHeader(regularUser))
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('allows admin access to scaffold health endpoint', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/health')
      .set(createAuthHeader(adminUser));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('returns 410 for deprecated POST /learning/event', async () => {
    const response = await request(app)
      .post('/api/centralized-ai/learning/event')
      .set(createAuthHeader(adminUser))
      .send({ userId: regularUser.id, eventData: { type: 'test' } })
      .expect(410);

    expect(response.body).toHaveProperty('replacement', 'POST /api/ai/learning/*');
    expect(response.headers.deprecation).toBe('true');
  });

  it('returns 410 for deprecated GET /models', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/models')
      .set(createAuthHeader(adminUser))
      .expect(410);

    expect(response.body).toHaveProperty('replacement', 'GET /api/ai/models');
  });
});

describe('twin canonical path (no centralized-ai production bypass)', () => {
  it('documents POST /api/ai/twin as canonical in ai routes', () => {
    const aiSource = readFileSync(join(process.cwd(), 'src/routes/ai.ts'), 'utf8');
    expect(aiSource).toMatch(/router\.post\(['"]\/twin['"]/);
    expect(aiSource).toMatch(/digitalLifeTwin/);
  });

  it('centralized-ai router does not expose /twin or /chat', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/routes/ai-centralized.ts'), 'utf8');
    expect(routerSource).not.toMatch(/router\.post\(['"]\/twin['"]/);
    expect(routerSource).not.toMatch(/router\.post\(['"]\/chat['"]/);
  });
});
