/**
 * Internal webhook test receiver (Phase 4C MVP).
 * Enabled when NODE_ENV=test or WEBHOOK_TEST_RECEIVER_ENABLED=true.
 */

import express, { Request, Response } from 'express';
import {
  verifyWebhookSignature,
  WEBHOOK_SIGNATURE_HEADER,
} from '../services/webhookSigning';

export interface CapturedWebhookDelivery {
  deliveryId: string | null;
  rawBody: string;
  payload: unknown;
  signatureHeader: string | null;
  receivedAt: string;
}

const capturedDeliveries: CapturedWebhookDelivery[] = [];
const MAX_CAPTURED = 50;

function receiverEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.WEBHOOK_TEST_RECEIVER_ENABLED === 'true'
  );
}

export function getCapturedWebhookDeliveries(): CapturedWebhookDelivery[] {
  return [...capturedDeliveries];
}

export function clearCapturedWebhookDeliveries(): void {
  capturedDeliveries.length = 0;
}

export function captureWebhookDelivery(input: CapturedWebhookDelivery): void {
  capturedDeliveries.unshift(input);
  if (capturedDeliveries.length > MAX_CAPTURED) {
    capturedDeliveries.pop();
  }
}

export function createInternalWebhookTestRouter(): express.Router {
  const router: express.Router = express.Router();

  router.post('/webhooks/test-receiver', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
    if (!receiverEnabled()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body ?? {});

    let payload: unknown = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const signatureHeader =
      typeof req.headers[WEBHOOK_SIGNATURE_HEADER.toLowerCase()] === 'string'
        ? (req.headers[WEBHOOK_SIGNATURE_HEADER.toLowerCase()] as string)
        : null;

    const deliveryIdHeader = req.headers['x-vssyl-delivery-id'];
    const deliveryId = typeof deliveryIdHeader === 'string' ? deliveryIdHeader : null;

    captureWebhookDelivery({
      deliveryId,
      rawBody,
      payload,
      signatureHeader,
      receivedAt: new Date().toISOString(),
    });

    res.status(200).json({ success: true, received: true });
  });

  router.get('/webhooks/test-receiver/capture', (_req: Request, res: Response) => {
    if (!receiverEnabled()) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ deliveries: getCapturedWebhookDeliveries() });
  });

  router.delete('/webhooks/test-receiver/capture', (_req: Request, res: Response) => {
    if (!receiverEnabled()) {
      return res.status(404).json({ error: 'Not found' });
    }
    clearCapturedWebhookDeliveries();
    res.json({ success: true });
  });

  return router;
}

export function verifyCapturedWebhookDelivery(input: {
  secret: string;
  delivery: CapturedWebhookDelivery;
}): boolean {
  return verifyWebhookSignature({
    secret: input.secret,
    rawBody: input.delivery.rawBody,
    signatureHeader: input.delivery.signatureHeader,
  });
}
