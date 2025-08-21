import { Request, Response } from 'express';
import { StripeService } from '../services/stripeService';
import { PrismaClient } from '@prisma/client';
import { isStripeConfigured, getStripeClient } from '../config/stripe';

const prisma = new PrismaClient();

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    // Get or create customer
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    let customerId = (user as any)?.stripeCustomerId;

    if (!customerId) {
      const customer = await StripeService.createCustomer({
        email: user!.email,
        name: user!.name || undefined,
        metadata: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id } as any,
      });

      customerId = customer.id;
    }

    const paymentIntent = await StripeService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customerId,
      metadata: { ...metadata, userId },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { tier, interval = 'month', moduleId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    // Get or create customer
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    let customerId = (user as any)?.stripeCustomerId;

    if (!customerId) {
      const customer = await StripeService.createCustomer({
        email: user!.email,
        name: user!.name || undefined,
        metadata: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id } as any,
      });

      customerId = customer.id;
    }

    // Determine price ID based on tier and interval
    let priceId: string;
    if (moduleId) {
      // Module subscription
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      // Create product and price if they don't exist
      if (!(module as any).stripeProductId) {
        const product = await StripeService.createProduct(
          module.name,
          module.description,
          { moduleId: module.id }
        );

        const price = await StripeService.createPrice(
          product.id,
          Math.round(module.basePrice * 100),
          'usd',
          { interval: interval as 'month' | 'year' }
        );

        await prisma.module.update({
          where: { id: moduleId },
          data: {
            stripeProductId: product.id,
            stripePriceId: price.id,
          } as any,
        });

        priceId = price.id;
      } else {
        priceId = (module as any).stripePriceId!;
      }
    } else {
      // Core platform subscription
      // For now, use placeholder price IDs - in production, these would be created in Stripe dashboard
      priceId = tier === 'enterprise' 
        ? (interval === 'year' ? 'price_enterprise_yearly' : 'price_enterprise_monthly')
        : (interval === 'year' ? 'price_standard_yearly' : 'price_standard_monthly');
    }

    const subscription = await StripeService.createSubscription({
      customerId,
      priceId,
      metadata: { userId, tier, interval, moduleId },
    });

    // Create local subscription record
    const localSubscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
      },
    });

    res.json({
      subscriptionId: localSubscription.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: (subscription as any).latest_invoice?.payment_intent?.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No Stripe subscription ID' });
    }

    const updatedSubscription = await StripeService.cancelSubscription(
      subscription.stripeSubscriptionId
    );

    // Update local record
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      },
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const reactivateSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No Stripe subscription ID' });
    }

    const updatedSubscription = await StripeService.reactivateSubscription(
      subscription.stripeSubscriptionId
    );

    // Update local record
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      },
    });

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({ error: 'Stripe client not available' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the event
    await StripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!(user as any)?.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({ error: 'Stripe client not available' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: (user as any).stripeCustomerId,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
}; 