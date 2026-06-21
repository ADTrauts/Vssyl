import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../controllers/entitlementController', () => ({
  getEntitlements: vi.fn((_req, res) => {
    res.json({
      entitlements: {
        tier: 'free',
        source: 'default',
        scope: 'personal',
        userId: 'user-test-1',
        features: ['basic_modules'],
      },
    });
  }),
  getTier: vi.fn((_req, res) => {
    res.json({
      tier: 'pro',
      source: 'subscription',
      subscriptionId: 'sub-1',
    });
  }),
  getEffectiveEntitlements: vi.fn((_req, res) => {
    res.json({
      entitlements: {
        tier: 'free',
        source: 'default',
        scope: 'personal',
        userId: 'user-test-1',
        features: ['basic_modules'],
      },
    });
  }),
}));

import accountEntitlementsRouter from '../../routes/accountEntitlements';
import { getEntitlements, getTier, getEffectiveEntitlements } from '../../controllers/entitlementController';

function mountApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/account', accountEntitlementsRouter);
  return app;
}

describe('account entitlement routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/account/tier delegates to getTier controller', async () => {
    const app = mountApp();
    const res = await request(app).get('/api/account/tier');

    expect(res.status).toBe(200);
    expect(getTier).toHaveBeenCalled();
    expect(res.body.tier).toBe('pro');
    expect(res.body.source).toBe('subscription');
  });

  it('GET /api/account/entitlements delegates to getEntitlements controller', async () => {
    const app = mountApp();
    const res = await request(app).get('/api/account/entitlements?businessId=biz-1');

    expect(res.status).toBe(200);
    expect(getEntitlements).toHaveBeenCalled();
    expect(res.body.entitlements.tier).toBe('free');
  });

  it('GET /api/account/effective aliases entitlements route', async () => {
    const app = mountApp();
    const res = await request(app).get('/api/account/effective');

    expect(res.status).toBe(200);
    expect(getEffectiveEntitlements).toHaveBeenCalled();
  });
});
