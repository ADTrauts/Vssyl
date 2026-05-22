/**
 * Signed outbound webhook POST with retry scheduling (Phase 4C).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { buildSignedWebhookHeaders } from './webhookSigning';

export const WEBHOOK_MAX_ATTEMPTS = 3;
export const WEBHOOK_RETRY_DELAYS_MS = [0, 1000, 5000] as const;

export interface PostSignedWebhookInput {
  url: string;
  secret: string;
  deliveryId: string;
  body: Record<string, unknown>;
  timeoutMs?: number;
}

export interface PostSignedWebhookResult {
  ok: boolean;
  httpStatus?: number;
  durationMs: number;
  errorMessage?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postSignedWebhook(
  input: PostSignedWebhookInput
): Promise<PostSignedWebhookResult> {
  const start = Date.now();
  const bodyString = JSON.stringify(input.body);
  const timeoutMs = input.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input.url, {
      method: 'POST',
      headers: buildSignedWebhookHeaders({
        secret: input.secret,
        body: bodyString,
        deliveryId: input.deliveryId,
      }),
      body: bodyString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - start;

    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        durationMs,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { ok: true, httpStatus: response.status, durationMs };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    const durationMs = Date.now() - start;
    const message =
      err.name === 'AbortError' ? `Webhook timeout after ${timeoutMs}ms` : err.message;
    return { ok: false, durationMs, errorMessage: message };
  }
}

export async function deliverWebhookAttempt(attemptId: string): Promise<void> {
  const attempt = await prisma.webhookDeliveryAttempt.findUnique({
    where: { id: attemptId },
    include: { subscription: true },
  });

  if (!attempt || attempt.status === 'SUCCESS' || attempt.status === 'DEAD_LETTER') {
    return;
  }

  if (attempt.subscription.status !== 'ACTIVE') {
    await prisma.webhookDeliveryAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'FAILED',
        errorMessage: 'Subscription disabled',
        completedAt: new Date(),
      },
    });
    return;
  }

  const payload =
    attempt.payload && typeof attempt.payload === 'object' && !Array.isArray(attempt.payload)
      ? (attempt.payload as Record<string, unknown>)
      : {};

  const result = await postSignedWebhook({
    url: attempt.subscription.url,
    secret: attempt.subscription.signingSecret,
    deliveryId: attempt.deliveryId,
    body: payload,
  });

  if (result.ok) {
    await prisma.webhookDeliveryAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUCCESS',
        httpStatus: result.httpStatus,
        durationMs: result.durationMs,
        errorMessage: null,
        completedAt: new Date(),
      },
    });
    return;
  }

  const nextAttemptNumber = attempt.attemptNumber + 1;
  if (nextAttemptNumber > WEBHOOK_MAX_ATTEMPTS) {
    await prisma.webhookDeliveryAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'DEAD_LETTER',
        httpStatus: result.httpStatus,
        durationMs: result.durationMs,
        errorMessage: result.errorMessage,
        completedAt: new Date(),
      },
    });
    void logger.warn('Webhook delivery dead-lettered', {
      operation: 'webhook_delivery_dead_letter',
      attemptId,
      deliveryId: attempt.deliveryId,
      eventType: attempt.eventType,
    });
    return;
  }

  const delayMs = WEBHOOK_RETRY_DELAYS_MS[nextAttemptNumber - 1] ?? 5000;
  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.webhookDeliveryAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'FAILED',
      httpStatus: result.httpStatus,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
      attemptNumber: nextAttemptNumber,
      nextRetryAt,
    },
  });

  void sleep(delayMs).then(() => deliverWebhookAttempt(attemptId));
}

export async function scheduleWebhookDelivery(input: {
  subscriptionId: string;
  eventType: string;
  domainEventId?: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const deliveryId = `whd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const attempt = await prisma.webhookDeliveryAttempt.create({
    data: {
      subscriptionId: input.subscriptionId,
      domainEventId: input.domainEventId ?? null,
      deliveryId,
      eventType: input.eventType,
      payload: input.payload as Prisma.InputJsonValue,
      status: 'PENDING',
      attemptNumber: 1,
    },
  });

  void deliverWebhookAttempt(attempt.id);
  return deliveryId;
}
