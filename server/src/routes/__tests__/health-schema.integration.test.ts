import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../health';

function mountHealth(): express.Application {
  const app = express();
  app.use('/api', healthRouter);
  return app;
}

describe('GET /api/schema production gate (F-008)', () => {
  afterEach(() => {
    delete process.env.ENABLE_PUBLIC_SCHEMA_ROUTE;
    process.env.NODE_ENV = 'test';
  });

  it('returns 404 when NODE_ENV is production and ENABLE_PUBLIC_SCHEMA_ROUTE is unset', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_PUBLIC_SCHEMA_ROUTE;

    const app = mountHealth();
    const res = await request(app).get('/api/schema');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Not found' });
  });
});
