# Stripe Price Points Implementation Plan

**Date**: January 2025  
**Status**: Planning  
**Purpose**: Complete step-by-step guide to properly implement all Stripe price points and sync them with the database

---

## 📋 Overview

This plan will guide you through:
1. Creating all Stripe products and prices
2. Syncing Stripe price IDs to the database
3. Creating a sync service for ongoing maintenance
4. Testing the complete integration
5. Verifying subscription flows work correctly

---

## 🎯 Current State

### What Exists:
- ✅ Database-driven pricing system (`PricingConfig` model)
- ✅ `PricingService` for reading pricing from database
- ✅ Setup script (`scripts/setup-stripe-products.js`) to create Stripe products/prices
- ✅ Seed script (`server/src/scripts/seedPricing.ts`) to populate database
- ✅ Code that uses `stripePriceId` from database

### What's Missing:
- ❌ Stripe products/prices not created in Stripe account
- ❌ Database pricing records don't have `stripePriceId` values
- ❌ No sync service to keep Stripe and database in sync
- ❌ No verification that price IDs match between systems

---

## 📊 Pricing Tiers & Amounts

Based on `PRICING_CONFIG` in `server/src/config/stripe.ts`:

| Tier | Monthly | Yearly | Per Employee | Included Employees |
|------|---------|--------|--------------|-------------------|
| **Free** | $0.00 | $0.00 | N/A | N/A |
| **Pro** | $29.00 | $290.00 | N/A | N/A |
| **Business Basic** | $49.99 | $499.99 | $5.00 | 10 |
| **Business Advanced** | $69.99 | $699.99 | $5.00 | 10 |
| **Enterprise** | $129.99 | $1,299.99 | $5.00 | 10 |

**Note**: Free tier doesn't need Stripe products/prices (no payment required)

---

## 🚀 Step-by-Step Implementation Plan

### **Phase 1: Preparation & Verification** (30 minutes)

#### Step 1.1: Verify Environment Variables
```bash
# Check that Stripe keys are set
echo $STRIPE_SECRET_KEY
echo $STRIPE_PUBLISHABLE_KEY
echo $STRIPE_WEBHOOK_SECRET
```

**Action Items**:
- [ ] Verify `STRIPE_SECRET_KEY` is set (test or live key)
- [ ] Verify `STRIPE_PUBLISHABLE_KEY` is set (for frontend)
- [ ] Note which environment you're using (test vs live)
- [ ] Document the Stripe account being used

#### Step 1.2: Verify Database Pricing Data
```bash
# Check if pricing is seeded in database
cd server
pnpm seed:pricing
```

**Action Items**:
- [ ] Run seed script to ensure database has pricing data
- [ ] Verify pricing records exist in database
- [ ] Check that `stripePriceId` fields are NULL (expected at this stage)

#### Step 1.3: Review Setup Script
**File**: `scripts/setup-stripe-products.js`

**Action Items**:
- [ ] Verify pricing amounts match `PRICING_CONFIG`
- [ ] Verify product IDs match `STRIPE_PRODUCTS` in `stripe.ts`
- [ ] Verify price IDs match `STRIPE_PRICES` in `stripe.ts`
- [ ] Note: Script uses custom IDs (e.g., `prod_pro`, `price_pro_monthly`)

**Current Pricing in Script**:
- Pro: $29.00/month, $290.00/year ✅
- Business Basic: $49.99/month, $499.99/year ✅
- Business Advanced: $69.99/month, $699.99/year ✅
- Enterprise: $129.99/month, $1,299.99/year ✅

---

### **Phase 2: Create Stripe Products & Prices** (15 minutes)

#### Step 2.1: Run Stripe Setup Script
```bash
# From project root
export STRIPE_SECRET_KEY=sk_test_your_key_here  # or sk_live_ for production
node scripts/setup-stripe-products.js
```

**Expected Output**:
```
🚀 Setting up Stripe products for Vssyl...
🔑 Using Stripe key: sk_test_xxxx...
🌍 Environment: TEST

📦 Creating product: Vssyl Pro Plan
✅ Product created: prod_pro
  💰 Creating price: Pro Monthly
  ✅ Price created: price_pro_monthly ($29.00/month)
  💰 Creating price: Pro Yearly
  ✅ Price created: price_pro_yearly ($290.00/year)

... (similar for other tiers)

🎉 All Stripe products and prices created successfully!
```

**Action Items**:
- [ ] Run the setup script
- [ ] Verify all products created successfully
- [ ] Verify all prices created successfully
- [ ] Note any products/prices that already existed (will show warnings)
- [ ] **Save the output** - you'll need the price IDs

#### Step 2.2: Verify in Stripe Dashboard
1. Go to Stripe Dashboard → Products
2. Verify 4 products exist:
   - `prod_pro` - Vssyl Pro Plan
   - `prod_business_basic` - Vssyl Business Basic
   - `prod_business_advanced` - Vssyl Business Advanced
   - `prod_enterprise` - Vssyl Enterprise Plan

3. For each product, verify 2 prices exist (monthly and yearly)

**Action Items**:
- [ ] Log into Stripe Dashboard
- [ ] Verify all products exist
- [ ] Verify all prices exist with correct amounts
- [ ] Screenshot the products page for documentation

---

### **Phase 3: Sync Stripe Price IDs to Database** (30 minutes)

#### Step 3.1: Create Stripe Price Sync Script

**File**: `server/src/scripts/syncStripePrices.ts` (NEW)

This script will:
1. Fetch all Stripe products and prices
2. Match them to database pricing records
3. Update database with `stripePriceId` values

**Action Items**:
- [ ] Create the sync script (see code below)
- [ ] Test the script in development first

#### Step 3.2: Run Sync Script
```bash
cd server
pnpm stripe:sync
```

**Expected Output**:
```
🔄 Syncing Stripe prices to database...

✅ Synced pro/monthly: price_pro_monthly
✅ Synced pro/yearly: price_pro_yearly
✅ Synced business_basic/monthly: price_business_basic_monthly
✅ Synced business_basic/yearly: price_business_basic_yearly
✅ Synced business_advanced/monthly: price_business_advanced_monthly
✅ Synced business_advanced/yearly: price_business_advanced_yearly
✅ Synced enterprise/monthly: price_enterprise_monthly
✅ Synced enterprise/yearly: price_enterprise_yearly

🎉 Sync completed! 8 prices synced.
```

**Action Items**:
- [ ] Run sync script
- [ ] Verify all prices synced successfully
- [ ] Check database to confirm `stripePriceId` fields are populated

#### Step 3.3: Verify Database Updates
```sql
-- Check that stripePriceId is populated
SELECT tier, billingCycle, basePrice, stripePriceId 
FROM pricing_configs 
WHERE isActive = true 
ORDER BY tier, billingCycle;
```

**Action Items**:
- [ ] Run SQL query to verify `stripePriceId` values
- [ ] Verify all 8 price records have Stripe IDs (excluding free tier)
- [ ] Document the price IDs for reference

---

### **Phase 4: Create Stripe Price Sync Service** (1 hour)

#### Step 4.1: Create Sync Service

**File**: `server/src/services/stripePriceSyncService.ts` (NEW)

This service will:
- Sync database prices to Stripe (create/update)
- Sync Stripe prices to database (update `stripePriceId`)
- Handle price updates for existing subscriptions
- Provide sync status endpoint

**Action Items**:
- [ ] Create the sync service (see implementation plan below)
- [ ] Add sync endpoints to pricing controller
- [ ] Add sync routes

#### Step 4.2: Add Sync Endpoints

**File**: `server/src/controllers/pricingController.ts` (MODIFY)

Add endpoints:
- `POST /api/pricing/sync-to-stripe` - Sync database → Stripe
- `POST /api/pricing/sync-from-stripe` - Sync Stripe → Database
- `GET /api/pricing/sync-status` - Check sync status

**Action Items**:
- [ ] Add sync endpoints to controller
- [ ] Add routes to `server/src/routes/pricing.ts`
- [ ] Test endpoints with Postman/curl

---

### **Phase 5: Update Code to Use Database Price IDs** (30 minutes)

#### Step 5.1: Verify Subscription Service

**File**: `server/src/services/subscriptionService.ts`

**Current Implementation**:
- ✅ Already uses `PricingService.getPricing()` to get `stripePriceId`
- ✅ Falls back to environment variables if database price ID missing

**Action Items**:
- [ ] Verify `getStripePriceId()` method works correctly
- [ ] Test that it retrieves price IDs from database
- [ ] Remove fallback to environment variables (optional cleanup)

#### Step 5.2: Verify Checkout Flow

**File**: `server/src/controllers/billingController.ts`

**Current Implementation**:
- ✅ `createCheckoutSession` uses `PricingService` to get price ID
- ✅ Checks if `stripePriceId` exists before creating session

**Action Items**:
- [ ] Test checkout session creation
- [ ] Verify it uses database price IDs
- [ ] Test with each tier (pro, business_basic, business_advanced, enterprise)

---

### **Phase 6: Testing** (1 hour)

#### Step 6.1: Test Stripe Integration

**Test Cases**:

1. **Create Subscription (Pro Monthly)**
   ```bash
   curl -X POST http://localhost:5000/api/billing/subscriptions \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN \
     -H "Content-Type: application/json" \
     -d '{
       "tier": "pro",
       "billingCycle": "monthly"
     }'
   ```

2. **Create Checkout Session**
   ```bash
   curl -X POST http://localhost:5000/api/billing/checkout/session \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN \
     -H "Content-Type: application/json" \
     -d '{
       "tier": "pro",
       "billingCycle": "monthly"
     }'
   ```

3. **Verify Subscription Created in Stripe**
   - Check Stripe Dashboard → Customers → Subscriptions
   - Verify subscription uses correct price ID

**Action Items**:
- [ ] Test subscription creation for each tier
- [ ] Test checkout session creation
- [ ] Verify subscriptions appear in Stripe Dashboard
- [ ] Verify price IDs match between database and Stripe

#### Step 6.2: Test Price Updates

**Scenario**: Update price in database, sync to Stripe

1. Update price in admin portal or database
2. Run sync script
3. Verify Stripe price updated
4. Verify existing subscriptions unaffected (grandfathering)

**Action Items**:
- [ ] Test price update flow
- [ ] Verify sync works correctly
- [ ] Test grandfathering logic (existing subscriptions keep old price)

---

### **Phase 7: Documentation & Cleanup** (30 minutes)

#### Step 7.1: Update Documentation

**Files to Update**:
- `memory-bank/BILLING_PAYMENT_IMPLEMENTATION_PLAN.md`
- `docs/setup/STRIPE_SETUP_GUIDE.md` (canonical Stripe setup; no separate `STRIPE_SETUP.md`)

**Action Items**:
- [ ] Document Stripe product/price IDs
- [ ] Document sync process
- [ ] Add troubleshooting guide
- [ ] Document how to add new tiers/prices

#### Step 7.2: Clean Up Hardcoded Values

**File**: `server/src/config/stripe.ts`

**Current State**:
- `STRIPE_PRODUCTS` and `STRIPE_PRICES` are hardcoded placeholders
- These are now deprecated (database is source of truth)

**Action Items**:
- [ ] Add deprecation comments
- [ ] Consider removing or keeping for backward compatibility
- [ ] Update code comments to reference database

---

## 📝 Implementation Details

### Sync Script Implementation

**File**: `server/src/scripts/syncStripePrices.ts`

```typescript
/**
 * Sync Stripe price IDs to database pricing records
 * Matches Stripe products/prices to database pricing configs
 */

import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured } from '../config/stripe';

async function syncStripePrices() {
  if (!isStripeConfigured() || !stripe) {
    console.error('❌ Stripe is not configured');
    process.exit(1);
  }

  console.log('🔄 Syncing Stripe prices to database...\n');

  // Map of tier names (database) to product IDs (Stripe)
  const tierToProductId: Record<string, string> = {
    'pro': 'prod_pro',
    'business_basic': 'prod_business_basic',
    'business_advanced': 'prod_business_advanced',
    'enterprise': 'prod_enterprise',
  };

  let synced = 0;

  // Get all active pricing configs from database
  const pricingConfigs = await prisma.pricingConfig.findMany({
    where: {
      isActive: true,
      tier: { not: 'free' }, // Free tier doesn't need Stripe
    },
  });

  for (const config of pricingConfigs) {
    const productId = tierToProductId[config.tier];
    if (!productId) {
      console.log(`⚠️  No product ID mapping for tier: ${config.tier}`);
      continue;
    }

    try {
      // Get all prices for this product from Stripe
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      // Find matching price by interval
      const interval = config.billingCycle === 'monthly' ? 'month' : 'year';
      const matchingPrice = prices.data.find(
        (p) => p.recurring?.interval === interval
      );

      if (!matchingPrice) {
        console.log(`⚠️  No Stripe price found for ${config.tier}/${config.billingCycle}`);
        continue;
      }

      // Verify amount matches (within 1 cent tolerance for rounding)
      const expectedAmount = Math.round(config.basePrice * 100);
      const actualAmount = matchingPrice.unit_amount || 0;
      
      if (Math.abs(expectedAmount - actualAmount) > 1) {
        console.log(`⚠️  Price mismatch for ${config.tier}/${config.billingCycle}:`);
        console.log(`   Database: $${config.basePrice}, Stripe: $${actualAmount / 100}`);
        continue;
      }

      // Update database with Stripe price ID
      await prisma.pricingConfig.update({
        where: { id: config.id },
        data: { stripePriceId: matchingPrice.id },
      });

      console.log(`✅ Synced ${config.tier}/${config.billingCycle}: ${matchingPrice.id}`);
      synced++;
    } catch (error) {
      console.error(`❌ Error syncing ${config.tier}/${config.billingCycle}:`, error);
    }
  }

  console.log(`\n🎉 Sync completed! ${synced} prices synced.`);
}

// Run if called directly
if (require.main === module) {
  syncStripePrices()
    .catch((error) => {
      console.error('❌ Error syncing prices:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { syncStripePrices };
```

### Sync Service Implementation

**File**: `server/src/services/stripePriceSyncService.ts` (NEW)

Key methods:
- `syncAllPrices()` - Sync all database prices to Stripe
- `syncPriceToStripe(pricingConfig)` - Sync single price
- `syncFromStripe()` - Update database with Stripe price IDs
- `getSyncStatus()` - Check if prices are in sync

---

## ✅ Success Criteria

### Phase 1-2: Stripe Setup
- [ ] All 4 products created in Stripe
- [ ] All 8 prices created in Stripe (2 per product)
- [ ] Products/prices visible in Stripe Dashboard

### Phase 3: Database Sync
- [ ] All 8 database pricing records have `stripePriceId` populated
- [ ] Price IDs match between Stripe and database
- [ ] Amounts match between Stripe and database

### Phase 4: Sync Service
- [ ] Sync service created and functional
- [ ] Sync endpoints working
- [ ] Can sync database → Stripe
- [ ] Can sync Stripe → Database

### Phase 5-6: Integration Testing
- [ ] Subscription creation uses correct Stripe price IDs
- [ ] Checkout sessions use correct Stripe price IDs
- [ ] Subscriptions appear correctly in Stripe Dashboard
- [ ] Webhooks process correctly

### Phase 7: Documentation
- [ ] All Stripe product/price IDs documented
- [ ] Sync process documented
- [ ] Troubleshooting guide created

---

## 🚨 Troubleshooting

### Issue: "Product already exists" warning
**Solution**: This is expected if products were created before. The script will skip existing products and create prices.

### Issue: "Price mismatch" warning
**Solution**: Check that database pricing matches Stripe pricing. Update either database or Stripe to match.

### Issue: "No Stripe price found"
**Solution**: Verify product ID mapping is correct. Check that prices were created in Stripe.

### Issue: Subscription creation fails
**Solution**: 
1. Verify `stripePriceId` is populated in database
2. Verify price ID exists in Stripe
3. Check Stripe API logs for errors

---

## 📅 Estimated Timeline

- **Phase 1**: 30 minutes (Preparation)
- **Phase 2**: 15 minutes (Create Stripe products/prices)
- **Phase 3**: 30 minutes (Sync to database)
- **Phase 4**: 1 hour (Create sync service)
- **Phase 5**: 30 minutes (Code updates)
- **Phase 6**: 1 hour (Testing)
- **Phase 7**: 30 minutes (Documentation)

**Total**: ~4.5 hours

---

## 🔄 Ongoing Maintenance

### When to Run Sync:
1. **After price changes in database** - Run sync to update Stripe
2. **After manual Stripe changes** - Run sync to update database
3. **Monthly audit** - Verify prices are in sync

### Automated Sync (Future):
- Consider adding scheduled job to verify sync status
- Add alerts if prices drift between systems

---

## 📚 Related Files

- `scripts/setup-stripe-products.js` - Creates Stripe products/prices
- `server/src/scripts/seedPricing.ts` - Seeds database pricing
- `server/src/scripts/syncStripePrices.ts` - Syncs Stripe → Database (TO CREATE)
- `server/src/services/stripePriceSyncService.ts` - Sync service (TO CREATE)
- `server/src/services/pricingService.ts` - Database pricing service
- `server/src/config/stripe.ts` - Stripe configuration
- `prisma/modules/billing/pricingConfig.prisma` - Pricing database schema

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 - Preparation & Verification

