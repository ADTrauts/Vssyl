import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { StripeService } from '../stripeService';
import { PaymentService } from '../paymentService';

describe('StripeService.handleWebhookEvent — payment_intent.succeeded (module_subscription)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to PaymentService.completeModuleSubscriptionFromPaymentIntent', async () => {
    const spy = vi
      .spyOn(PaymentService, 'completeModuleSubscriptionFromPaymentIntent')
      .mockResolvedValue(undefined);

    const paymentIntent = {
      id: 'pi_module_sub_test',
      amount: 2500,
      metadata: {
        type: 'module_subscription',
        moduleId: 'mod-test',
        userId: 'user-test',
        tier: 'premium',
      },
    } as unknown as Stripe.PaymentIntent;

    const event = {
      id: 'evt_payment_intent_succeeded',
      type: 'payment_intent.succeeded',
      data: { object: paymentIntent },
    } as unknown as Stripe.Event;

    await StripeService.handleWebhookEvent(event);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pi_module_sub_test',
        metadata: expect.objectContaining({ type: 'module_subscription' }),
      })
    );

    spy.mockRestore();
  });
});
