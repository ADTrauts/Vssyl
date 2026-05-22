import { describe, expect, it } from 'vitest';
import {
  buildSignedWebhookHeaders,
  signWebhookPayload,
  verifyWebhookSignature,
} from '../webhookSigning';

describe('webhookSigning', () => {
  it('signs and verifies payload', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ type: 'webhook.test', ok: true });
    const timestamp = 1_700_000_000;
    const signature = signWebhookPayload(secret, timestamp, body);
    const header = buildSignedWebhookHeaders({
      secret,
      body,
      deliveryId: 'whd_test',
      timestamp,
    });

    expect(
      verifyWebhookSignature({
        secret,
        rawBody: body,
        signatureHeader: header['X-Vssyl-Signature'],
        nowSeconds: timestamp,
      })
    ).toBe(true);
  });

  it('rejects tampered payload', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ type: 'webhook.test' });
    const timestamp = 1_700_000_000;
    const header = buildSignedWebhookHeaders({
      secret,
      body,
      deliveryId: 'whd_test',
      timestamp,
    });

    expect(
      verifyWebhookSignature({
        secret,
        rawBody: JSON.stringify({ type: 'tampered' }),
        signatureHeader: header['X-Vssyl-Signature'],
        nowSeconds: timestamp,
      })
    ).toBe(false);
  });
});
