# Stripe Dashboard Setup Guide for Vssyl

## Overview
This guide walks through setting up Stripe Dashboard for Vssyl's comprehensive billing system with subscription tiers, module add-ons, and developer revenue sharing.

## Step 1: Create Stripe Account & Get API Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Get your API keys**:
   - **Test Keys** (for development):
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Live Keys** (for production):
     - Publishable key: `pk_live_...`
     - Secret key: `sk_live_...`

## Step 2: Create Products in Stripe Dashboard

### Core Platform Products

#### 1. Standard Subscription
- **Product Name**: "Vssyl Standard Plan"
- **Product ID**: `prod_standard` (important - must match your code)
- **Description**: "Standard AI-powered workspace with full Digital Life Twin system"

**Prices to create:**
- **Monthly**: $29.99 USD, recurring monthly
  - Price ID: `price_standard_monthly`
- **Yearly**: $299.99 USD, recurring yearly  
  - Price ID: `price_standard_yearly`

#### 2. Enterprise Subscription
- **Product Name**: "Vssyl Enterprise Plan"
- **Product ID**: `prod_enterprise`
- **Description**: "Enterprise workspace with advanced features and team management"

**Prices to create:**
- **Monthly**: $99.99 USD, recurring monthly
  - Price ID: `price_enterprise_monthly`
- **Yearly**: $999.99 USD, recurring yearly
  - Price ID: `price_enterprise_yearly`

### Module Add-on Products

#### 3. Module Premium
- **Product Name**: "Vssyl Module Premium"
- **Product ID**: `prod_module_premium`
- **Description**: "Premium module subscription for enhanced functionality"

**Prices to create:**
- **Monthly**: $9.99 USD, recurring monthly
  - Price ID: `price_module_premium_monthly`
- **Yearly**: $99.99 USD, recurring yearly
  - Price ID: `price_module_premium_yearly`

#### 4. Module Enterprise
- **Product Name**: "Vssyl Module Enterprise"
- **Product ID**: `prod_module_enterprise`
- **Description**: "Enterprise module subscription with advanced features"

**Prices to create:**
- **Monthly**: $29.99 USD, recurring monthly
  - Price ID: `price_module_enterprise_monthly`
- **Yearly**: $299.99 USD, recurring yearly
  - Price ID: `price_module_enterprise_yearly`

## Step 3: Configure Webhooks

### Create Webhook Endpoint
1. **Go to**: Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://vssyl-server-235369681725.us-central1.run.app/api/payment/webhook`
3. **Events to select**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.created`
   - `transfer.failed`

4. **Get Webhook Secret**: Copy the webhook signing secret (starts with `whsec_`)

## Step 4: Environment Variables Configuration

### Production Environment Variables
Add these to your Google Cloud Secret Manager or environment:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For frontend (Next.js)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
```

### Development Environment Variables
For local development, add to your `.env` file:

```bash
# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# For frontend (Next.js)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
```

## Step 5: Test the Integration

### Test Subscription Flow
1. **Register a new user** on your platform
2. **Navigate to subscription/billing page**
3. **Select a plan** (Standard or Enterprise)
4. **Use Stripe test card**: `4242 4242 4242 4242`
5. **Verify subscription creation** in Stripe Dashboard

### Test Payment Intent Flow
1. **Try module purchases** or one-time payments
2. **Verify payment intents** are created correctly
3. **Check webhook delivery** in Stripe Dashboard

## Step 6: Configure Revenue Sharing (for Module Developers)

### Set up Connect for Developer Payouts
1. **Go to**: Connect → Get started
2. **Choose**: "Facilitate payments for others"
3. **Set up**: Express or Custom accounts for developers
4. **Configure**: Automatic transfers with your 30/70 split

### Transfer Configuration
Your system is configured for:
- **Platform Share**: 30%
- **Developer Share**: 70%

This happens automatically through the `StripeService.createTransfer()` method.

## Step 7: Production Checklist

### Before Going Live:
- [ ] Switch to Live API keys
- [ ] Update webhook endpoint URL to production
- [ ] Test all subscription flows
- [ ] Test webhook delivery
- [ ] Verify revenue sharing transfers
- [ ] Set up monitoring and alerts

### Stripe Dashboard Settings:
- [ ] Enable customer portal for self-service
- [ ] Configure invoice settings
- [ ] Set up tax collection (if needed)
- [ ] Configure email notifications
- [ ] Set up dispute handling

## Important Notes

### Product/Price ID Matching
Your code expects specific IDs - make sure they match exactly:
- Products: `prod_standard`, `prod_enterprise`, `prod_module_premium`, `prod_module_enterprise`
- Prices: `price_standard_monthly`, `price_standard_yearly`, etc.

### Webhook Security
The webhook endpoint includes signature verification for security. Make sure the webhook secret is correctly configured.

### Revenue Sharing
The system automatically calculates and processes revenue splits for module subscriptions, transferring 70% to developers and keeping 30% for the platform.

## Testing Scenarios

### 1. Standard Monthly Subscription
- Amount: $29.99
- Interval: Monthly
- Expected: Subscription created, customer charged monthly

### 2. Enterprise Yearly Subscription  
- Amount: $999.99
- Interval: Yearly
- Expected: Subscription created, customer charged yearly

### 3. Module Premium Add-on
- Amount: $9.99
- Interval: Monthly
- Expected: Module subscription created, revenue split processed

### 4. Failed Payment
- Use declined test card: `4000 0000 0000 0002`
- Expected: Payment fails, webhook triggered, subscription status updated

## Support & Monitoring

### Stripe Dashboard Monitoring
- Monitor subscription metrics
- Track payment success/failure rates
- Review dispute and chargeback activity
- Monitor webhook delivery success

### Application Monitoring
- Check webhook endpoint health
- Monitor subscription sync accuracy
- Track revenue split calculations
- Verify customer portal functionality

This setup provides a complete billing system with subscription management, revenue sharing, and comprehensive payment processing for your Vssyl platform!
