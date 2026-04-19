import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createAppWithStripeWebhookMount } from '../../__tests__/helpers/stripeWebhookTestApp';

describe('Stripe webhook public mount', () => {
  const app = createAppWithStripeWebhookMount();

  it('accepts POST /api/payment/webhook without Authorization (not 401)', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).not.toBe(401);
    expect([400, 500]).toContain(res.status);
  });

  it('still requires JWT for other /api/payment routes', async () => {
    const res = await request(app).post('/api/payment/intent').send({ amount: 1000 });

    expect(res.status).toBe(401);
  });
});
