import { PrismaClient } from '@prisma/client';
import { 
  stripe, 
  STRIPE_PRODUCTS, 
  STRIPE_PRICES, 
  PRICING_CONFIG, 
  REVENUE_SPLIT,
  isStripeConfigured,
  type StripeWebhookEvent 
} from '../config/stripe';

const prisma = new PrismaClient();

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreateTransferParams {
  amount: number;
  currency: string;
  destination: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  /**
   * Create a Stripe customer
   */
  static async createCustomer(params: CreateCustomerParams) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });

    return customer;
  }

  /**
   * Create a subscription
   */
  static async createSubscription(params: CreateSubscriptionParams) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  /**
   * Create a payment intent
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      metadata: params.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  }

  /**
   * Create a transfer (for payouts)
   */
  static async createTransfer(params: CreateTransferParams) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const transfer = await stripe.transfers.create({
      amount: params.amount,
      currency: params.currency,
      destination: params.destination,
      metadata: params.metadata,
    });

    return transfer;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return subscription;
  }

  /**
   * Reactivate a subscription
   */
  static async reactivateSubscription(subscriptionId: string) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }

  /**
   * Get customer details
   */
  static async getCustomer(customerId: string) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  }

  /**
   * Create a product in Stripe
   */
  static async createProduct(name: string, description?: string, metadata?: Record<string, string>) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const product = await stripe.products.create({
      name,
      description,
      metadata,
    });

    return product;
  }

  /**
   * Create a price in Stripe
   */
  static async createPrice(
    productId: string, 
    unitAmount: number, 
    currency: string = 'usd',
    recurring?: { interval: 'month' | 'year' }
  ) {
    if (!isStripeConfigured() || !stripe) {
      throw new Error('Stripe is not configured');
    }

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring,
    });

    return price;
  }

  /**
   * Handle webhook events
   */
  static async handleWebhookEvent(event: any) {
    if (!isStripeConfigured()) {
      console.log('Stripe not configured, skipping webhook');
      return;
    }

    const { type, data } = event;

    switch (type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(data.object);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(data.object);
        break;
      case 'transfer.created':
        await this.handleTransferCreated(data.object);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(data.object);
        break;
      default:
        console.log(`Unhandled webhook event: ${type}`);
    }
  }

  /**
   * Handle subscription created
   */
  private static async handleSubscriptionCreated(subscription: any) {
    console.log('Subscription created:', subscription.id);
    
    // Update local subscription record
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(subscription: any) {
    console.log('Subscription updated:', subscription.id);
    
    // Update local subscription record
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(subscription: any) {
    console.log('Subscription deleted:', subscription.id);
    
    // Update local subscription record
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
      },
    });
  }

  /**
   * Handle payment succeeded
   */
  private static async handlePaymentSucceeded(invoice: any) {
    console.log('Payment succeeded:', invoice.id);
    
    // Update invoice record
    await prisma.invoice.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Handle revenue sharing for module subscriptions
    if (invoice.subscription) {
      const moduleSubscription = await prisma.moduleSubscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { module: true },
      });

      if (moduleSubscription && moduleSubscription.module.isProprietary === false) {
        // Calculate developer revenue
        const developerRevenue = invoice.amount_paid * moduleSubscription.module.revenueSplit;
        const platformRevenue = invoice.amount_paid - developerRevenue;

        // Record developer revenue
        await prisma.developerRevenue.create({
          data: {
            developerId: moduleSubscription.module.developerId,
            moduleId: moduleSubscription.moduleId,
            periodStart: new Date(),
            periodEnd: new Date(),
            totalRevenue: invoice.amount_paid,
            platformRevenue,
            developerRevenue,
            payoutStatus: 'pending',
          },
        });
      }
    }
  }

  /**
   * Handle payment failed
   */
  private static async handlePaymentFailed(invoice: any) {
    console.log('Payment failed:', invoice.id);
    
    // Update invoice record
    await prisma.invoice.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'uncollectible',
      },
    });
  }

  /**
   * Handle payment intent succeeded
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: any) {
    console.log('Payment intent succeeded:', paymentIntent.id);
    // Additional payment intent handling if needed
  }

  /**
   * Handle payment intent failed
   */
  private static async handlePaymentIntentFailed(paymentIntent: any) {
    console.log('Payment intent failed:', paymentIntent.id);
    // Additional payment intent handling if needed
  }

  /**
   * Handle transfer created
   */
  private static async handleTransferCreated(transfer: any) {
    console.log('Transfer created:', transfer.id);
    
    // Update payout records
    await prisma.developerRevenue.updateMany({
      where: { 
        developerRevenue: transfer.amount / 100, // Convert from cents
        payoutStatus: 'pending',
      },
      data: {
        payoutStatus: 'paid',
        payoutDate: new Date(),
      },
    });
  }

  /**
   * Handle transfer failed
   */
  private static async handleTransferFailed(transfer: any) {
    console.log('Transfer failed:', transfer.id);
    
    // Update payout records
    await prisma.developerRevenue.updateMany({
      where: { 
        developerRevenue: transfer.amount / 100, // Convert from cents
        payoutStatus: 'pending',
      },
      data: {
        payoutStatus: 'failed',
      },
    });
  }
} 