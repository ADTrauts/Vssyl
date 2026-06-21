import { describe, it, expect } from 'vitest';
import { paymentApiDeprecation } from '../../middleware/paymentApiDeprecation';

describe('paymentApiDeprecation middleware', () => {
  it('sets deprecation headers', () => {
    const headers: Record<string, string> = {};
    const req = {} as Parameters<typeof paymentApiDeprecation>[0];
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    } as Parameters<typeof paymentApiDeprecation>[1];
    let nextCalled = false;
    paymentApiDeprecation(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(headers.Deprecation).toBe('true');
    expect(headers.Link).toContain('/api/billing');
    expect(headers['X-API-Deprecation-Notice']).toContain('deprecated');
  });
});
