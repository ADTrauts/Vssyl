/**
 * Business webhook subscription registry (Phase 4C).
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { DOMAIN_EVENT_TYPES } from '../events/domainEventRegistry';
import type { DomainEvent } from '../events/types';
import { scheduleWebhookDelivery } from './webhookDeliveryService';

export const SUPPORTED_WEBHOOK_EVENT_TYPES = [
  DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
  DOMAIN_EVENT_TYPES.FILE_SHARED,
] as const;

export type SupportedWebhookEventType = (typeof SUPPORTED_WEBHOOK_EVENT_TYPES)[number];

export function isSupportedWebhookEventType(value: string): value is SupportedWebhookEventType {
  return (SUPPORTED_WEBHOOK_EVENT_TYPES as readonly string[]).includes(value);
}

export function generateWebhookSigningSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function assertBusinessAdmin(userId: string, businessId: string): Promise<void> {
  const member = await prisma.businessMember.findFirst({
    where: {
      businessId,
      userId,
      isActive: true,
      role: 'ADMIN',
    },
    select: { id: true },
  });

  if (!member) {
    throw new Error('Business admin access required');
  }
}

export async function listWebhookSubscriptions(businessId: string) {
  return prisma.webhookSubscription.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      businessId: true,
      url: true,
      eventTypes: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createWebhookSubscription(input: {
  businessId: string;
  createdByUserId: string;
  url: string;
  eventTypes: string[];
  description?: string;
}) {
  await assertBusinessAdmin(input.createdByUserId, input.businessId);

  const eventTypes = input.eventTypes.filter(isSupportedWebhookEventType);
  if (eventTypes.length === 0) {
    throw new Error('At least one supported event type is required');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Webhook URL must use http or https');
  }

  const signingSecret = generateWebhookSigningSecret();

  const subscription = await prisma.webhookSubscription.create({
    data: {
      businessId: input.businessId,
      url: input.url.trim(),
      signingSecret,
      eventTypes,
      description: input.description?.trim() || null,
      createdByUserId: input.createdByUserId,
      status: 'ACTIVE',
    },
  });

  return {
    subscription: {
      id: subscription.id,
      businessId: subscription.businessId,
      url: subscription.url,
      eventTypes: subscription.eventTypes,
      status: subscription.status,
      description: subscription.description,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    },
    signingSecret,
  };
}

export async function deleteWebhookSubscription(input: {
  businessId: string;
  subscriptionId: string;
  userId: string;
}) {
  await assertBusinessAdmin(input.userId, input.businessId);

  const existing = await prisma.webhookSubscription.findFirst({
    where: { id: input.subscriptionId, businessId: input.businessId },
  });
  if (!existing) {
    throw new Error('Webhook subscription not found');
  }

  await prisma.webhookSubscription.delete({ where: { id: input.subscriptionId } });
}

export async function sendWebhookSubscriptionTest(input: {
  businessId: string;
  subscriptionId: string;
  userId: string;
}) {
  await assertBusinessAdmin(input.userId, input.businessId);

  const subscription = await prisma.webhookSubscription.findFirst({
    where: { id: input.subscriptionId, businessId: input.businessId, status: 'ACTIVE' },
  });
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }

  const deliveryId = await scheduleWebhookDelivery({
    subscriptionId: subscription.id,
    eventType: 'webhook.test',
    payload: {
      type: 'webhook.test',
      businessId: input.businessId,
      sentAt: new Date().toISOString(),
      message: 'Test delivery from Vssyl webhook subscriptions',
    },
  });

  return { deliveryId };
}

async function resolveEventBusinessId(event: DomainEvent): Promise<string | null> {
  if (event.businessId) return event.businessId;

  const metadataBusinessId = event.metadata?.businessId;
  if (typeof metadataBusinessId === 'string' && metadataBusinessId.trim()) {
    return metadataBusinessId.trim();
  }

  if (event.type === DOMAIN_EVENT_TYPES.FILE_SHARED) {
    const file = await prisma.file.findUnique({
      where: { id: event.entityId },
      select: { dashboard: { select: { businessId: true } } },
    });
    return file?.dashboard?.businessId ?? null;
  }

  return null;
}

export function buildOutboundWebhookPayload(event: DomainEvent): Record<string, unknown> {
  return {
    id: event.id,
    type: event.type,
    actorUserId: event.actorUserId,
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    businessId: event.businessId ?? null,
    dashboardId: event.dashboardId ?? null,
    metadata: event.metadata ?? {},
    createdAt: event.createdAt,
  };
}

export async function deliverDomainEventToWebhookSubscriptions(event: DomainEvent): Promise<void> {
  if (!isSupportedWebhookEventType(event.type)) {
    return;
  }

  const businessId = await resolveEventBusinessId(event);
  if (!businessId) {
    return;
  }

  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      businessId,
      status: 'ACTIVE',
      eventTypes: { has: event.type },
    },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const payload = buildOutboundWebhookPayload(event);

  await Promise.all(
    subscriptions.map((subscription) =>
      scheduleWebhookDelivery({
        subscriptionId: subscription.id,
        eventType: event.type,
        domainEventId: event.id,
        payload,
      })
    )
  );
}
