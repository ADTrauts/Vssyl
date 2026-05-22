import crypto from 'crypto';

export const WEBHOOK_SIGNATURE_HEADER = 'X-Vssyl-Signature';
export const WEBHOOK_TIMESTAMP_HEADER = 'X-Vssyl-Timestamp';
export const WEBHOOK_DELIVERY_ID_HEADER = 'X-Vssyl-Delivery-Id';

export interface WebhookSignatureParts {
  timestamp: number;
  signature: string;
}

export function buildWebhookSignaturePayload(timestamp: number, body: string): string {
  return `${timestamp}.${body}`;
}

export function signWebhookPayload(
  secret: string,
  timestamp: number,
  body: string
): string {
  const payload = buildWebhookSignaturePayload(timestamp, body);
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function formatWebhookSignatureHeader(timestamp: number, signature: string): string {
  return `t=${timestamp},v1=${signature}`;
}

export function parseWebhookSignatureHeader(header: string | null | undefined): WebhookSignatureParts | null {
  if (!header || typeof header !== 'string') return null;

  const parts = header.split(',').map((part) => part.trim());
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    if (part.startsWith('t=')) {
      const value = Number.parseInt(part.slice(2), 10);
      if (!Number.isNaN(value)) timestamp = value;
    }
    if (part.startsWith('v1=')) {
      signature = part.slice(3);
    }
  }

  if (timestamp == null || !signature) return null;
  return { timestamp, signature };
}

export function verifyWebhookSignature(input: {
  secret: string;
  rawBody: string;
  signatureHeader: string | null | undefined;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): boolean {
  const parsed = parseWebhookSignatureHeader(input.signatureHeader);
  if (!parsed) return false;

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return false;
  }

  const expected = signWebhookPayload(input.secret, parsed.timestamp, input.rawBody);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(parsed.signature, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function buildSignedWebhookHeaders(input: {
  secret: string;
  body: string;
  deliveryId: string;
  timestamp?: number;
}): Record<string, string> {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(input.secret, timestamp, input.body);

  return {
    'Content-Type': 'application/json',
    [WEBHOOK_SIGNATURE_HEADER]: formatWebhookSignatureHeader(timestamp, signature),
    [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp),
    [WEBHOOK_DELIVERY_ID_HEADER]: input.deliveryId,
  };
}
