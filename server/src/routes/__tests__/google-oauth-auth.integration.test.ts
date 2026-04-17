import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import googleOAuthRouter from '../googleOAuth';

function createGoogleOAuthTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/google-oauth', googleOAuthRouter);
  return app;
}

describe('Google OAuth routes — auth wiring', () => {
  const app = createGoogleOAuthTestApp();
  const businessId = '00000000-0000-0000-0000-000000000001';

  it('returns 401 without JWT for auth-url', async () => {
    const res = await request(app).get(`/api/google-oauth/business/${businessId}/auth-url`);
    expect(res.status).toBe(401);
  });

  it('returns 401 without JWT for status', async () => {
    const res = await request(app).get(`/api/google-oauth/business/${businessId}/status`);
    expect(res.status).toBe(401);
  });

  it('returns 401 without JWT for test-config', async () => {
    const res = await request(app)
      .post(`/api/google-oauth/business/${businessId}/test-config`)
      .send({});
    expect(res.status).toBe(401);
  });

  it('does not require JWT for OAuth callback (public redirect target)', async () => {
    const res = await request(app).get(
      `/api/google-oauth/business/${businessId}/callback?code=test`
    );
    expect(res.status).not.toBe(401);
  });
});
