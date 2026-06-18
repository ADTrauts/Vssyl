import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authenticateJWT } from '../../middleware/auth';
import {
  aiContextDebugTransitionalMiddleware,
  AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES,
  matchAiContextDebugTransitionalRoute,
} from '../../middleware/aiContextDebugTransitional';
import aiContextDebugRouter from '../ai-context-debug';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

function createAiContextDebugTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/ai-context-debug',
    authenticateJWT,
    aiContextDebugTransitionalMiddleware,
    aiContextDebugRouter
  );
  return app;
}

const SAMPLE_PATHS = [
  { method: 'GET', path: '/user/test-user-id' },
  { method: 'GET', path: '/session/test-session' },
  { method: 'POST', path: '/validate' },
  { method: 'GET', path: '/cross-module/test-user-id' },
  { method: 'GET', path: '/stats' },
  { method: 'POST', path: '/assemble' },
] as const;

describe('ai-context-debug transitional headers (0D-E / AP-F-029)', () => {
  const app = createAiContextDebugTestApp();
  let adminUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    userIdsToCleanup.push(adminUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('mounts transitional middleware on ai-context-debug in server index', () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).toMatch(/aiContextDebugTransitionalMiddleware/);
    expect(indexSource).toMatch(/\/api\/ai-context-debug[\s\S]*aiContextDebugTransitionalMiddleware/);
  });

  it('covers all six ai-context-debug handlers in disposition rules', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/routes/ai-context-debug.ts'), 'utf8');
    const handlers = [
      ...routerSource.matchAll(/router\.(get|post)\(['"]([^'"]+)['"]/g),
    ];
    expect(handlers).toHaveLength(6);

    const uncovered: string[] = [];
    for (const [, method, routePath] of handlers) {
      const samplePath = routePath.replace(/:([^/]+)/g, 'sample-$1');
      const match = matchAiContextDebugTransitionalRoute(method.toUpperCase(), samplePath);
      if (!match) {
        uncovered.push(`${method.toUpperCase()} ${routePath}`);
      }
    }
    expect(uncovered, `Unmapped routes: ${uncovered.join(', ')}`).toEqual([]);
    expect(AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES).toHaveLength(6);
  });

  it.each(SAMPLE_PATHS)(
    'sets Deprecation header for $method $path',
    async ({ method, path }) => {
      const agent = request(app)[method.toLowerCase() as 'get' | 'post'](
        `/api/ai-context-debug${path}`
      ).set(createAuthHeader(adminUser));

      if (method === 'POST') {
        agent.send(
          path === '/validate'
            ? { userId: adminUser.id, contextType: 'full' }
            : { userId: adminUser.id, query: 'test query' }
        );
      }

      const response = await agent;
      expect(response.headers.deprecation).toBe('true');
      expect(response.headers['x-ai-context-debug-disposition']).toBeDefined();
      expect(response.headers.link).toContain('successor-version');
    }
  );
});
