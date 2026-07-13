/**
 * Twin HTTP seam: route auth + twin service mock (Phase 1).
 */
import express from 'express';
import request from 'supertest';
import type { User } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { processAsDigitalLifeTwin } = vi.hoisted(() => ({
  processAsDigitalLifeTwin: vi.fn(),
}));

vi.mock('../../ai/core/DigitalLifeTwinService', () => {
  return {
    DigitalLifeTwinService: vi.fn().mockImplementation(() => ({
      processAsDigitalLifeTwin,
      processAsDigitalLifeTwinStreaming: vi.fn(),
      getCrossModuleContext: vi.fn(),
      getModuleContext: vi.fn(),
    })),
  };
});

vi.mock('../../services/aiQueryService', () => ({
  AIQueryService: {
    checkQueryAvailability: vi.fn(async () => ({
      available: true,
      isUnlimited: true,
      remaining: 999,
    })),
    consumeQuery: vi.fn(async () => ({ success: true })),
  },
}));

vi.mock('../../services/featureGatingService', () => ({
  FeatureGatingService: {
    checkFeatureAccess: vi.fn(async () => ({
      hasAccess: true,
      usageInfo: { remaining: 100 },
    })),
  },
}));

import { authenticateJWT } from '../../middleware/auth';
import {
  cleanupTestUsers,
  createAuthHeader,
  createTestUser,
} from '../../__tests__/helpers/auth';
import aiRouter from '../ai';

function createTwinTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', authenticateJWT, aiRouter);
  return app;
}

describe('POST /api/ai/twin route seam (Phase 1)', () => {
  let user: User;
  const app = createTwinTestApp();

  beforeAll(async () => {
    user = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestUsers([user.id]);
  });

  beforeEach(() => {
    processAsDigitalLifeTwin.mockReset();
    processAsDigitalLifeTwin.mockResolvedValue({
      response: 'Deterministic twin reply',
      confidence: 0.9,
      actions: [],
      insights: [],
      personalityAlignment: 0.8,
      learningUpdates: [],
      metadata: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        processingTime: 12,
      },
    });
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/ai/twin').send({ query: 'hi' });
    expect(res.status).toBe(401);
    expect(processAsDigitalLifeTwin).not.toHaveBeenCalled();
  });

  it('accepts authenticated text-only twin request', async () => {
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(user))
      .send({ query: 'Hello Twin', context: {} });

    expect(res.status).toBe(200);
    expect(processAsDigitalLifeTwin).toHaveBeenCalled();
    expect(JSON.stringify(res.body)).toMatch(/Deterministic twin reply/);
  });

  it('rejects empty query', async () => {
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(user))
      .send({ query: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(processAsDigitalLifeTwin).not.toHaveBeenCalled();
  });
});
