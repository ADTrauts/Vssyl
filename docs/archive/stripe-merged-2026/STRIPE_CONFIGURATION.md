# Stripe Configuration Guide

This guide explains how to configure Stripe for payment processing in Vssyl.

## Overview

Vssyl uses Stripe for:
- Subscription billing (Pro, Business Basic, Business Advanced, Enterprise tiers)
- Payment method management (white-labeled in-app experience)
- AI Query Pack purchases
- Module subscription payments
- Developer revenue payouts

## Environment Variables

### For Google Cloud Deployment

If you're deploying to Google Cloud Run, use **Google Secret Manager** instead of environment variables:

```bash
# Run the setup script to add Stripe secrets
./scripts/setup-stripe-secrets-gcp.sh
```

This script will:
1. Prompt you for your Stripe keys
2. Create secrets in Google Secret Manager:
   - `stripe-secret-key` - Your Stripe secret key
   - `stripe-publishable-key` - Your Stripe publishable key
   - `stripe-webhook-secret` - Your Stripe webhook signing secret

The secrets are automatically loaded by Cloud Run services (configured in `cloudbuild.yaml`).

### For Local Development

Add these to your `.env` file (backend) and `.env.local` (frontend):

**Backend (`server/.env`):**
```bash
# Stripe Secret Key (starts with sk_)
STRIPE_SECRET_KEY=sk_live_...

# Stripe Webhook Secret (from Stripe Dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Stripe API Version (defaults to 2025-07-30.basil)
STRIPE_API_VERSION=2025-07-30.basil
```

**Frontend (`web/.env.local`):**
```bash
# Stripe Publishable Key (starts with pk_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### For Development/Testing

Use Stripe test mode keys:

**Backend:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From test webhook endpoint
```

**Frontend:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Checking Existing Secrets in Google Cloud

To check if Stripe secrets are already configured in Google Cloud:

```bash
# List all secrets
gcloud secrets list --project=vssyl-472202

# Check if Stripe secrets exist
gcloud secrets describe stripe-secret-key --project=vssyl-472202
gcloud secrets describe stripe-publishable-key --project=vssyl-472202
gcloud secrets describe stripe-webhook-secret --project=vssyl-472202
```

If secrets already exist, you can update them:

```bash
# Update an existing secret
echo -n "your-new-key" | gcloud secrets versions add stripe-secret-key \
  --project=vssyl-472202 \
  --data-file=-
```

## Getting Your Stripe Keys

1. **Sign up for Stripe**: Go to [https://stripe.com](https://stripe.com) and create an account
2. **Get API Keys**:
   - Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
   - Copy your **Publishable key** (starts with `pk_`)
   - Copy your **Secret key** (starts with `sk_`)
   - Toggle "Test mode" to get test keys for development

3. **Set up Webhooks**:
   - Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - Set endpoint URL to: `https://your-domain.com/api/payment/webhook`
   - Select events to listen for:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `setup_intent.succeeded`
   - Copy the **Signing secret** (starts with `whsec_`)

## Payment Method Management

Vssyl provides **two ways** to manage payment methods:

### 1. White-Labeled In-App Experience (Recommended)

Users can add payment methods directly in the app using Stripe Elements:
- Navigate to **Billing & Subscriptions** modal
- Go to **Payment Methods** tab
- Click **"Add Payment Method"**
- Enter card details in the secure form
- Payment method is saved to Stripe and attached to the customer

**Benefits:**
- ✅ Users never leave your app
- ✅ Consistent branding and UX
- ✅ PCI-compliant (Stripe handles all card data)
- ✅ No redirects or external portals

### 2. Stripe Customer Portal (Optional)

For advanced management, users can access Stripe's hosted portal:
- Click **"Stripe Portal"** button in Payment Methods tab
- Redirects to Stripe's customer portal
- Users can update billing info, view invoices, etc.

**When to use:**
- Advanced billing management
- Invoice downloads
- Payment history
- Update billing address

## Stripe Products & Prices

### Setting Up Products in Stripe

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create products for each tier:
   - **Pro** (monthly and yearly)
   - **Business Basic** (monthly and yearly)
   - **Business Advanced** (monthly and yearly)
   - **Enterprise** (monthly and yearly)

3. For each product, create prices:
   - Monthly recurring price
   - Yearly recurring price (with discount)

4. Copy the **Price IDs** (start with `price_`)

5. Configure prices in Vssyl:
   - Go to **Admin Portal > Pricing Management**
   - Edit each tier
   - Enter the Stripe Price IDs for monthly and yearly billing

### Example Price Setup

```
Product: Pro Plan
├── Price: $29/month (price_pro_monthly)
└── Price: $290/year (price_pro_yearly)

Product: Business Basic
├── Price: $49.99/month (price_business_basic_monthly)
└── Price: $499.99/year (price_business_basic_yearly)
```

## Webhook Configuration

### Local Development

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payment/webhook
```

The CLI will output a webhook signing secret (starts with `whsec_`). Use this in your `.env` file.

### Production

1. Create webhook endpoint in Stripe Dashboard
2. Set URL to: `https://your-domain.com/api/payment/webhook`
3. Select required events (see list above)
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Test Scenarios

1. **Add Payment Method**:
   - Go to Billing modal > Payment Methods
   - Click "Add Payment Method"
   - Enter test card `4242 4242 4242 4242`
   - Should successfully add

2. **Create Subscription**:
   - Select a plan in Plans tab
   - Complete checkout
   - Subscription should be created in Stripe

3. **Webhook Events**:
   - Check Stripe Dashboard > Events for webhook deliveries
   - Verify events are received and processed

## Troubleshooting

### TypeScript API Version Errors

**Error**: `Type '"2025-08-27.basil"' is not assignable to type '"2025-07-30.basil"'`

**Cause**: TypeScript types for Stripe may lag behind the actual Stripe API versions.

**Solution**: This is expected and handled in the codebase. The API version is cast with `as any` to allow using newer Stripe API versions. The code uses `2025-08-27.basil` to match the Stripe Dashboard, which is correct.

**Files Affected**:
- `server/src/config/stripe.ts`
- `server/src/services/aiQueryService.ts`
- `server/src/services/developerPortalService.ts`
- `server/src/services/overageBillingService.ts`
- `server/src/services/moduleSubscriptionService.ts`
- `server/src/services/subscriptionService.ts`

### "Stripe is not configured" Error

**Cause**: Environment variables are missing or incorrect.

**Solution**:
1. Verify `STRIPE_SECRET_KEY` is set in backend `.env`
   - **Note**: Backend only needs the secret key (`STRIPE_SECRET_KEY`)
   - The publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is only needed in the frontend
2. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in frontend `.env.local`
3. Restart both frontend and backend servers
4. Check that keys start with `sk_` (secret) and `pk_` (publishable)
5. **Important**: The `isStripeConfigured()` function only checks for the secret key on the backend - this is intentional and correct behavior

### Payment Methods Not Loading

**Cause**: Customer doesn't exist in Stripe or no payment methods attached.

**Solution**:
1. Check Stripe Dashboard > Customers
2. Verify customer exists for the user
3. If not, create a subscription first (this creates the customer)

### Webhook Events Not Received

**Cause**: Webhook endpoint not configured or secret incorrect.

**Solution**:
1. Verify webhook URL is correct in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` matches the signing secret
3. For local dev, use Stripe CLI to forward webhooks
4. Check server logs for webhook errors

### Setup Intent Fails

**Cause**: Customer not created or invalid setup intent.

**Solution**:
1. Ensure user has a Stripe customer ID (created on first subscription)
2. Check setup intent status in Stripe Dashboard
3. Verify payment method is valid (use test card `4242 4242 4242 4242`)

## Security Best Practices

1. **Never commit keys to git**: Use `.env` files (already in `.gitignore`)
2. **Use different keys for dev/prod**: Test mode vs Live mode
3. **Rotate keys regularly**: Especially if exposed
4. **Use webhook signatures**: Always verify webhook authenticity
5. **HTTPS only**: All Stripe API calls must use HTTPS in production

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

## Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Status](https://status.stripe.com)

For Vssyl integration issues:
- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure webhook events are configured in Stripe Dashboard

