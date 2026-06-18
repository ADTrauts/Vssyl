import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import {
  AI_PIPELINE_HANDLER_REGISTRY,
  allowedStatusesFor,
  apiPath,
} from './fixtures/aiPipelineHandlerRegistry';

vi.mock('../../ai/core/DigitalLifeTwinService', () => ({
  DigitalLifeTwinService: vi.fn().mockImplementation(() => ({
    processAsDigitalLifeTwin: vi.fn(async () => ({
      response: '1B-D mock response',
      confidence: 0.9,
      structured: null,
      metadata: {
        provider: 'mock',
        processingTime: 1,
        aiResponseQualityWarnings: [],
        pipelineTrace: {
          traceId: '1bd-mock-trace',
          createdAt: new Date().toISOString(),
          userId: 'mock-user',
          userMessage: 'ping',
          finalResponse: 'ok',
          confidence: 0.9,
          stages: [],
          genericResponseRisk: false,
        },
      },
    })),
  })),
}));

describe('admin-portal AI Pipeline HTTP coverage (1B-D / AP-F-030)', () => {
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

  it('registry contains 45 handlers', () => {
    expect(AI_PIPELINE_HANDLER_REGISTRY).toHaveLength(45);
  });

  describe.each(AI_PIPELINE_HANDLER_REGISTRY)('admin smoke $id', (spec) => {
    it(`${spec.method.toUpperCase()} ${spec.path} is reachable for admin`, async () => {
      const req = request(app)[spec.method](apiPath(spec.path)).set(createAuthHeader(adminUser));
      if (spec.body) {
        req.send(spec.body);
      }
      const response = await req;
      const allowed = allowedStatusesFor(spec);
      expect(
        allowed,
        `unexpected status ${response.status} for ${spec.method} ${spec.path}: ${JSON.stringify(response.body)}`,
      ).toContain(response.status);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('authZ sampling', () => {
    const authSample = [
      AI_PIPELINE_HANDLER_REGISTRY[0],
      AI_PIPELINE_HANDLER_REGISTRY.find((h) => h.id === 'policies-intents-create')!,
      AI_PIPELINE_HANDLER_REGISTRY.find((h) => h.id === 'test-lab')!,
      AI_PIPELINE_HANDLER_REGISTRY.find((h) => h.id === 'retention-purge')!,
    ];

    it.each(authSample)('rejects non-admin for $id', async (spec) => {
      const req = request(app)[spec.method](apiPath(spec.path)).set(createAuthHeader(regularUser));
      if (spec.body) {
        req.send(spec.body);
      }
      const response = await req.expect(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it.each(authSample)('rejects unauthenticated for $id', async (spec) => {
      const req = request(app)[spec.method](apiPath(spec.path));
      if (spec.body) {
        req.send(spec.body);
      }
      const response = await req.expect(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });
});
