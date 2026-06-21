import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const billingClientPath = path.resolve(__dirname, '../../api/billing.ts');
const stripeLibPath = path.resolve(__dirname, '../stripe.ts');
const paymentLegacyPath = path.resolve(__dirname, '../../api/payment.ts');

describe('billing client migration (PP-3 Phase 3)', () => {
  const legacyApiCallPattern = /['"`]\/api\/payment/;

  it('billing.ts uses only /api/billing paths', () => {
    const source = fs.readFileSync(billingClientPath, 'utf8');
    expect(source).toContain('/api/billing');
    expect(source).not.toMatch(legacyApiCallPattern);
  });

  it('stripe.ts does not call /api/payment directly', () => {
    const source = fs.readFileSync(stripeLibPath, 'utf8');
    expect(source).not.toMatch(legacyApiCallPattern);
    expect(source).toContain('../api/billing');
  });

  it('legacy payment.ts re-exports billing client', () => {
    const source = fs.readFileSync(paymentLegacyPath, 'utf8');
    expect(source).toContain('./billing');
    expect(source).not.toMatch(legacyApiCallPattern);
  });
});

describe('billing client API surface', () => {
  it('exports canonical subscription and module helpers', async () => {
    const billing = await import('../../api/billing');
    expect(typeof billing.subscribeModule).toBe('function');
    expect(typeof billing.cancelPlatformSubscription).toBe('function');
    expect(typeof billing.createCheckoutSession).toBe('function');
    expect(typeof billing.createPaymentIntent).toBe('function');
    expect(typeof billing.listPaymentMethods).toBe('function');
  });
});
