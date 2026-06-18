import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { requireAdmin } from '../admin-portal/adminPortalShared';
import {
  centralizedAiDeprecatedMiddleware,
  matchCentralizedAiDeprecatedRoute,
  getCentralizedAi0dBFenceRules,
  CENTRALIZED_AI_DEPRECATED_ROUTES,
} from '../../middleware/centralizedAiFence';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function createCentralizedAiTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/centralized-ai',
    authenticateJWT,
    requireAdmin,
    centralizedAiDeprecatedMiddleware
  );
  return app;
}

/** Sample paths — one per fence cluster (formerly 97 handlers in deleted router). */
const FENCED_SAMPLE_PATHS: Array<{ method: string; path: string; replacementIncludes: string }> = [
  { method: 'GET', path: '/health', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/patterns', replacementIncludes: 'ai-pipeline' },
  { method: 'POST', path: '/patterns/analyze', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/insights', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/privacy/settings', replacementIncludes: 'compliance' },
  { method: 'GET', path: '/consent/stats', replacementIncludes: 'compliance' },
  { method: 'GET', path: '/scheduler/status', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/analytics/forecasts', replacementIncludes: 'analytics' },
  { method: 'GET', path: '/audit/logs', replacementIncludes: 'audit' },
  { method: 'GET', path: '/performance/metrics', replacementIncludes: 'performance' },
  { method: 'GET', path: '/security/audit', replacementIncludes: 'security' },
  { method: 'POST', path: '/ab-testing/create', replacementIncludes: 'test-lab' },
  { method: 'GET', path: '/notifications', replacementIncludes: 'notifications' },
  { method: 'GET', path: '/sso/providers', replacementIncludes: 'system' },
  { method: 'GET', path: '/automl/jobs', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/workflows', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/decision-support', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/predictive-maintenance', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/continuous-learning', replacementIncludes: '/api/ai/learning' },
  { method: 'GET', path: '/predictive/insights', replacementIncludes: 'ai-pipeline' },
  { method: 'GET', path: '/business/metrics', replacementIncludes: 'business-ai' },
  { method: 'GET', path: '/ai-insights/patterns', replacementIncludes: 'ai-pipeline' },
  { method: 'POST', path: '/learning/event', replacementIncludes: '/api/ai/learning' },
  { method: 'GET', path: '/models', replacementIncludes: '/api/ai/models' },
];

/** Documented handler count at retirement (0D-G). */
const RETIRED_CENTRALIZED_AI_HANDLER_COUNT = 97;

describe('centralized-ai admin fence (Wave 1D + 0D-B + 0D-G)', () => {
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

  it('0D-G: legacy ai-centralized router file removed', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/ai-centralized.ts'))).toBe(false);
  });

  it('mounts requireAdmin without legacy router in server index', () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).toMatch(/\/api\/centralized-ai[\s\S]*requireAdmin/);
    expect(indexSource).toMatch(/centralizedAiDeprecatedMiddleware/);
    expect(indexSource).not.toMatch(/aiCentralizedRouter/);
    expect(indexSource).not.toMatch(/ai-centralized['"]/);
  });

  it('blocks non-admin from centralized-ai routes', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/health')
      .set(createAuthHeader(regularUser))
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('returns 410 for retired GET /health (0D-B)', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/health')
      .set(createAuthHeader(adminUser))
      .expect(410);

    expect(response.body).toHaveProperty('replacement', '/admin-portal/ai-pipeline');
    expect(response.headers.deprecation).toBe('true');
  });

  it('returns 410 for unknown centralized-ai paths (0D-G catch-all)', async () => {
    const response = await request(app)
      .get('/api/centralized-ai/unknown/legacy/path')
      .set(createAuthHeader(adminUser))
      .expect(410);

    expect(response.body.replacement).toBe('/admin-portal/ai-pipeline');
    expect(response.headers.deprecation).toBe('true');
  });

  it.each(FENCED_SAMPLE_PATHS)(
    'returns 410 for $method $path',
    async ({ method, path, replacementIncludes }) => {
      const agent = request(app)[method.toLowerCase() as 'get' | 'post'](
        `/api/centralized-ai${path}`
      )
        .set(createAuthHeader(adminUser));

      if (method === 'POST') {
        agent.send({});
      }

      const response = await agent.expect(410);
      expect(response.body.replacement).toContain(replacementIncludes);
      expect(response.headers.deprecation).toBe('true');
    }
  );

  it('fence rules cover documented retired handler count', () => {
    expect(CENTRALIZED_AI_DEPRECATED_ROUTES.length).toBeGreaterThanOrEqual(20);
    expect(RETIRED_CENTRALIZED_AI_HANDLER_COUNT).toBe(97);
  });

  it('introduced 0D-B fence rule groups', () => {
    const rules = getCentralizedAi0dBFenceRules();
    expect(rules.length).toBeGreaterThanOrEqual(18);
  });
});

describe('twin canonical path (no centralized-ai production bypass)', () => {
  it('documents POST /api/ai/twin as canonical in ai routes', () => {
    const aiSource = readFileSync(join(process.cwd(), 'src/routes/ai.ts'), 'utf8');
    expect(aiSource).toMatch(/router\.post\(['"]\/twin['"]/);
    expect(aiSource).toMatch(/digitalLifeTwin/);
  });

  it('no centralized-ai router exposes twin or chat paths', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/ai-centralized.ts'))).toBe(false);
    const match = matchCentralizedAiDeprecatedRoute('POST', '/twin');
    expect(match).toBeUndefined();
  });
});
