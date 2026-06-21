import { describe, it, expect } from 'vitest';
import { paymentRouteRetired } from '../../middleware/paymentRouteRetired';

describe('paymentRouteRetired middleware', () => {
  it('returns 410 with successor billing path', () => {
    const req = { path: '/subscription' } as Parameters<typeof paymentRouteRetired>[0];
    let statusCode = 0;
    let body: Record<string, unknown> = {};
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (payload: Record<string, unknown>) => {
        body = payload;
      },
    } as Parameters<typeof paymentRouteRetired>[1];

    paymentRouteRetired(req, res);

    expect(statusCode).toBe(410);
    expect(body.retired).toBe(true);
    expect(body.successor).toContain('/api/billing');
    expect(String(body.error)).toContain('retired');
  });
});
