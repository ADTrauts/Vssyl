import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';

const { stripeWebhookMock } = vi.hoisted(() => ({
  stripeWebhookMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../stripeService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../stripeService')>();
  return {
    ...mod,
    StripeService: {
      ...mod.StripeService,
      handleWebhookEvent: stripeWebhookMock,
    },
  };
});

import { PaymentService } from '../paymentService';
import { ModuleSubscriptionService } from '../moduleSubscriptionService';
import { prisma } from '../../lib/prisma';

describe('PaymentService.handleWebhookEvent', () => {
  beforeEach(() => {
    stripeWebhookMock.mockClear();
  });

  it('delegates to StripeService.handleWebhookEvent', async () => {
    const event = {
      id: 'evt_delegate',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1' } },
    } as unknown as Stripe.Event;

    await PaymentService.handleWebhookEvent(event);

    expect(stripeWebhookMock).toHaveBeenCalledTimes(1);
    expect(stripeWebhookMock).toHaveBeenCalledWith(event);
  });
});

describe('ModuleSubscriptionService.handleStripeWebhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('marks module subscriptions cancelled on customer.subscription.deleted', async () => {
    const updateMany = vi.spyOn(prisma.moduleSubscription, 'updateMany').mockResolvedValue({ count: 1 });
    const svc = new ModuleSubscriptionService();
    const event = {
      id: 'evt_1',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_mod_test' } },
    } as unknown as Stripe.Event;

    await svc.handleStripeWebhook(event);

    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_mod_test' },
      data: { status: 'cancelled' },
    });
  });

  it('marks module subscriptions active on invoice.payment_succeeded', async () => {
    const updateMany = vi.spyOn(prisma.moduleSubscription, 'updateMany').mockResolvedValue({ count: 1 });
    const svc = new ModuleSubscriptionService();
    const event = {
      id: 'evt_3',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_active',
        },
      },
    } as unknown as Stripe.Event;

    await svc.handleStripeWebhook(event);

    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_active' },
      data: { status: 'active' },
    });
  });

  it('marks module subscriptions past_due on invoice.payment_failed', async () => {
    const updateMany = vi.spyOn(prisma.moduleSubscription, 'updateMany').mockResolvedValue({ count: 1 });
    const svc = new ModuleSubscriptionService();
    const event = {
      id: 'evt_2',
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_past_due',
        },
      },
    } as unknown as Stripe.Event;

    await svc.handleStripeWebhook(event);

    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_past_due' },
      data: { status: 'past_due' },
    });
  });
});
