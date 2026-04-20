# Billing & Pricing System Updates

**Date**: January 2025  
**Status**: Planning Phase  
**Purpose**: Document pricing structure updates and implementation plan

---

## ✅ Pricing Structure (Confirmed)

### Current Tier Pricing

1. **Free Tier**: $0/month
   - 50 AI queries/month (hard limit)
   - Basic modules access
   - Ad-supported

2. **Pro Tier**: $29.00/month or $290.00/year
   - Base AI query allowance (e.g., 1,000 queries/month)
   - All modules access
   - Ad-free
   - **Additional queries available for purchase** (Cursor-style)

3. **Business Basic**: $49.99/month or $499.99/year
   - $5.00/employee after 10 included employees
   - Base AI allowance with team pooling
   - Team management features

4. **Business Advanced**: $69.99/month or $699.99/year
   - $5.00/employee after 10 included employees
   - Higher AI allowance with team pooling
   - Advanced analytics, DLP, audit logs

5. **Enterprise**: $129.99/month or $1,299.99/year
   - $5.00/employee after 10 included employees
   - Unlimited AI usage
   - Custom integrations, dedicated support

---

## 🔄 Required Updates

### 1. Developer Revenue Split (Apple App Store Model)

#### Current Implementation
- **Fixed 70/30 split** (70% developer, 30% platform)
- Applied uniformly to all module subscriptions

#### Target Implementation (Apple-style)
- **Standard Commission**: 30% platform, 70% developer (first year of subscription)
- **Small Business Program**: 15% platform, 85% developer (for developers earning <$1M/year)
- **Long-term Subscriptions**: 15% platform, 85% developer (after first year)
- **Free Apps**: 0% commission (no paid digital goods)

#### Implementation Plan

**Database Changes**:
```prisma
// Add to Module model
model Module {
  // ... existing fields
  revenueSplit Float @default(0.7) // Default 70% to developer
  smallBusinessEligible Boolean @default(false)
  totalLifetimeRevenue Float @default(0) // Track for eligibility
}

// Add to DeveloperRevenue model
model DeveloperRevenue {
  // ... existing fields
  commissionRate Float // Store actual commission rate used
  commissionType String // 'standard', 'small_business', 'long_term'
  isFirstYear Boolean @default(true)
}
```

**Service Changes**:
```typescript
// server/src/services/revenueSplitService.ts (NEW)
export class RevenueSplitService {
  /**
   * Calculate revenue split based on Apple App Store model
   */
  static async calculateRevenueSplit(
    moduleId: string,
    subscriptionAmount: number,
    subscriptionAge: number // months
  ): Promise<{
    platformShare: number;
    developerShare: number;
    commissionRate: number;
    commissionType: 'standard' | 'small_business' | 'long_term';
  }> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { developer: true },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    // Check if developer qualifies for Small Business Program
    const developerRevenue = await this.getDeveloperLifetimeRevenue(module.developerId);
    const isSmallBusiness = developerRevenue < 1_000_000; // $1M threshold

    // Check if subscription is past first year
    const isLongTerm = subscriptionAge > 12; // After 12 months

    // Determine commission rate
    let commissionRate: number;
    let commissionType: 'standard' | 'small_business' | 'long_term';

    if (isSmallBusiness) {
      commissionRate = 0.15; // 15% platform, 85% developer
      commissionType = 'small_business';
    } else if (isLongTerm) {
      commissionRate = 0.15; // 15% platform, 85% developer
      commissionType = 'long_term';
    } else {
      commissionRate = 0.30; // 30% platform, 70% developer
      commissionType = 'standard';
    }

    const platformShare = subscriptionAmount * commissionRate;
    const developerShare = subscriptionAmount - platformShare;

    return {
      platformShare,
      developerShare,
      commissionRate,
      commissionType,
    };
  }

  /**
   * Get developer's lifetime revenue from App Store
   */
  private static async getDeveloperLifetimeRevenue(developerId: string): Promise<number> {
    const revenue = await prisma.developerRevenue.aggregate({
      where: { developerId },
      _sum: { totalRevenue: true },
    });

    return revenue._sum.totalRevenue || 0;
  }
}
```

**Files to Modify**:
- `server/src/config/stripe.ts` - Update REVENUE_SPLIT to be dynamic
- `server/src/services/moduleSubscriptionService.ts` - Use RevenueSplitService
- `server/src/services/stripeService.ts` - Update payment handling
- `server/src/services/paymentService.ts` - Update subscription creation
- `prisma/modules/billing/subscriptions.prisma` - Add fields to Module model

---

### 2. AI Usage Caps & Query Packs (Cursor-style)

#### Current Implementation
- Free tier: 50 queries/month (hard limit)
- Pro tier: "unlimited_ai" feature (no cap)
- No query pack purchase system

#### Target Implementation
- **Pro Tier**: Base allowance (e.g., 1,000 queries/month) + ability to purchase more
- **Query Packs**: Pre-paid query bundles that roll over
- **Usage Tracking**: Real-time tracking with alerts

#### Implementation Plan

**Database Changes**:
```prisma
// Add to User model or create new model
model AIQueryBalance {
  id String @id @default(uuid())
  userId String
  businessId String?
  
  // Base allowance from subscription
  baseAllowance Int @default(0)
  baseAllowanceUsed Int @default(0)
  
  // Purchased query packs
  purchasedQueries Int @default(0) // Total purchased, never expires
  purchasedQueriesUsed Int @default(0)
  
  // Current period tracking
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  
  // Rollover tracking
  queriesRolledOver Int @default(0) // From previous periods
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  business Business? @relation(fields: [businessId], references: [id])
  
  @@unique([userId, businessId])
  @@index([userId])
}

// Query pack purchases
model AIQueryPurchase {
  id String @default(uuid())
  userId String
  businessId String?
  
  packType String // 'small', 'medium', 'large', 'enterprise'
  queriesAmount Int
  amountPaid Float
  stripePaymentIntentId String?
  
  status String // 'pending', 'completed', 'failed'
  
  createdAt DateTime @default(now())
  completedAt DateTime?
  
  user User @relation(fields: [userId], references: [id])
  business Business? @relation(fields: [businessId], references: [id])
  
  @@index([userId])
  @@index([status])
}
```

**Query Pack Pricing**:
```typescript
// server/src/config/aiQueryPacks.ts (NEW)
export const AI_QUERY_PACKS = {
  small: {
    queries: 500,
    price: 10.00,
    name: 'Small Pack',
  },
  medium: {
    queries: 2500,
    price: 40.00, // 20% discount vs small
    name: 'Medium Pack',
  },
  large: {
    queries: 5000,
    price: 70.00, // 30% discount vs small
    name: 'Large Pack',
  },
  enterprise: {
    queries: 10000,
    price: 120.00, // 40% discount vs small
    name: 'Enterprise Pack',
  },
} as const;

// Base allowances by tier
export const AI_BASE_ALLOWANCES = {
  free: 50,
  pro: 1000,
  business_basic: 2000, // Team-wide pool
  business_advanced: 5000, // Team-wide pool
  enterprise: -1, // Unlimited (-1 means unlimited)
} as const;
```

**Service Implementation**:
```typescript
// server/src/services/aiQueryService.ts (NEW)
export class AIQueryService {
  /**
   * Check if user has available AI queries
   */
  static async checkQueryAvailability(
    userId: string,
    businessId?: string
  ): Promise<{
    available: boolean;
    remaining: number;
    totalAvailable: number;
    breakdown: {
      baseAllowance: number;
      purchased: number;
      rolledOver: number;
    };
  }> {
    // Get or create balance
    let balance = await prisma.aIQueryBalance.findUnique({
      where: { userId_businessId: { userId, businessId: businessId || null } },
    });

    if (!balance) {
      // Initialize balance based on subscription tier
      balance = await this.initializeBalance(userId, businessId);
    }

    // Calculate total available
    const baseRemaining = Math.max(0, balance.baseAllowance - balance.baseAllowanceUsed);
    const purchasedRemaining = balance.purchasedQueries - balance.purchasedQueriesUsed;
    const totalRemaining = baseRemaining + purchasedRemaining + balance.queriesRolledOver;

    return {
      available: totalRemaining > 0,
      remaining: totalRemaining,
      totalAvailable: balance.baseAllowance + balance.purchasedQueries + balance.queriesRolledOver,
      breakdown: {
        baseAllowance: baseRemaining,
        purchased: purchasedRemaining,
        rolledOver: balance.queriesRolledOver,
      },
    };
  }

  /**
   * Consume AI query
   */
  static async consumeQuery(
    userId: string,
    businessId?: string,
    amount: number = 1
  ): Promise<{ success: boolean; remaining: number }> {
    const availability = await this.checkQueryAvailability(userId, businessId);

    if (!availability.available || availability.remaining < amount) {
      return { success: false, remaining: availability.remaining };
    }

    // Update balance (prefer base allowance first, then purchased)
    const balance = await prisma.aIQueryBalance.findUnique({
      where: { userId_businessId: { userId, businessId: businessId || null } },
    });

    if (!balance) {
      throw new Error('Balance not found');
    }

    let baseUsed = balance.baseAllowanceUsed;
    let purchasedUsed = balance.purchasedQueriesUsed;
    let rolledOver = balance.queriesRolledOver;
    let remaining = amount;

    // Use rolled over queries first
    if (rolledOver > 0) {
      const useRolledOver = Math.min(rolledOver, remaining);
      rolledOver -= useRolledOver;
      remaining -= useRolledOver;
    }

    // Use base allowance
    if (remaining > 0 && baseUsed < balance.baseAllowance) {
      const useBase = Math.min(balance.baseAllowance - baseUsed, remaining);
      baseUsed += useBase;
      remaining -= useBase;
    }

    // Use purchased queries
    if (remaining > 0) {
      purchasedUsed += remaining;
      remaining = 0;
    }

    await prisma.aIQueryBalance.update({
      where: { id: balance.id },
      data: {
        baseAllowanceUsed: baseUsed,
        purchasedQueriesUsed: purchasedUsed,
        queriesRolledOver: rolledOver,
      },
    });

    const newAvailability = await this.checkQueryAvailability(userId, businessId);

    return { success: true, remaining: newAvailability.remaining };
  }

  /**
   * Purchase query pack
   */
  static async purchaseQueryPack(
    userId: string,
    packType: 'small' | 'medium' | 'large' | 'enterprise',
    businessId?: string
  ): Promise<{ paymentIntentId: string; queries: number; price: number }> {
    const pack = AI_QUERY_PACKS[packType];
    if (!pack) {
      throw new Error('Invalid pack type');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pack.price * 100),
      currency: 'usd',
      metadata: {
        userId,
        businessId: businessId || '',
        packType,
        queries: pack.queries.toString(),
        type: 'ai_query_pack',
      },
    });

    // Create purchase record
    await prisma.aIQueryPurchase.create({
      data: {
        userId,
        businessId,
        packType,
        queriesAmount: pack.queries,
        amountPaid: pack.price,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      queries: pack.queries,
      price: pack.price,
    };
  }

  /**
   * Handle successful query pack purchase
   */
  static async completeQueryPackPurchase(paymentIntentId: string): Promise<void> {
    const purchase = await prisma.aIQueryPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!purchase || purchase.status !== 'pending') {
      throw new Error('Purchase not found or already processed');
    }

    // Get or create balance
    let balance = await prisma.aIQueryBalance.findUnique({
      where: {
        userId_businessId: {
          userId: purchase.userId,
          businessId: purchase.businessId || null,
        },
      },
    });

    if (!balance) {
      balance = await this.initializeBalance(purchase.userId, purchase.businessId);
    }

    // Add purchased queries
    await prisma.aIQueryBalance.update({
      where: { id: balance.id },
      data: {
        purchasedQueries: {
          increment: purchase.queriesAmount,
        },
      },
    });

    // Mark purchase as completed
    await prisma.aIQueryPurchase.update({
      where: { id: purchase.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Initialize balance based on subscription tier
   */
  private static async initializeBalance(
    userId: string,
    businessId?: string
  ): Promise<AIQueryBalance> {
    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: businessId
        ? { businessId, status: 'active' }
        : { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    const tier = subscription?.tier || 'free';
    const baseAllowance = AI_BASE_ALLOWANCES[tier as keyof typeof AI_BASE_ALLOWANCES] || 0;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await prisma.aIQueryBalance.create({
      data: {
        userId,
        businessId,
        baseAllowance,
        baseAllowanceUsed: 0,
        purchasedQueries: 0,
        purchasedQueriesUsed: 0,
        queriesRolledOver: 0,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  /**
   * Reset monthly base allowance (called at start of each month)
   */
  static async resetMonthlyAllowance(): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all balances that need reset
    const balances = await prisma.aIQueryBalance.findMany({
      where: {
        currentPeriodStart: { lt: periodStart },
      },
    });

    for (const balance of balances) {
      // Calculate rollover (unused base allowance)
      const unusedBase = Math.max(0, balance.baseAllowance - balance.baseAllowanceUsed);
      
      // Get subscription for new base allowance
      const subscription = await prisma.subscription.findFirst({
        where: balance.businessId
          ? { businessId: balance.businessId, status: 'active' }
          : { userId: balance.userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      });

      const tier = subscription?.tier || 'free';
      const newBaseAllowance = AI_BASE_ALLOWANCES[tier as keyof typeof AI_BASE_ALLOWANCES] || 0;

      await prisma.aIQueryBalance.update({
        where: { id: balance.id },
        data: {
          baseAllowance: newBaseAllowance,
          baseAllowanceUsed: 0,
          queriesRolledOver: unusedBase, // Roll over unused base allowance
          currentPeriodStart: periodStart,
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      });
    }
  }
}
```

**Files to Create**:
- `server/src/services/aiQueryService.ts` - Query balance management
- `server/src/services/revenueSplitService.ts` - Dynamic revenue split calculation
- `server/src/config/aiQueryPacks.ts` - Query pack pricing
- `server/src/controllers/aiQueryController.ts` - Query pack purchase endpoints
- `prisma/modules/billing/aiQueryBalance.prisma` - NEW: AI query balance model
- `prisma/modules/billing/aiQueryPurchase.prisma` - NEW: Query pack purchase model

**Files to Modify**:
- `server/src/services/featureGatingService.ts` - Update to check AI query balance
- `server/src/middleware/subscriptionMiddleware.ts` - Add AI query check middleware
- `server/src/services/moduleSubscriptionService.ts` - Use RevenueSplitService
- `server/src/services/stripeService.ts` - Handle query pack payment intents
- `server/src/routes/billing.ts` - Add query pack purchase routes
- `web/src/components/BillingModal.tsx` - Add query pack purchase UI
- `web/src/components/AIQueryBalance.tsx` - NEW: Query balance display

---

## 📋 Implementation Checklist

### Phase 1: Revenue Split Updates
- [ ] Create RevenueSplitService
- [ ] Add fields to Module model (totalLifetimeRevenue, smallBusinessEligible)
- [ ] Update ModuleSubscriptionService to use dynamic revenue split
- [ ] Update StripeService payment handling
- [ ] Add commission tracking to DeveloperRevenue model
- [ ] Create monthly job to calculate developer lifetime revenue
- [ ] Update developer portal to show commission rates

### Phase 2: AI Query Caps & Packs
- [x] Create AIQueryBalance and AIQueryPurchase models ✅
- [x] Create AIQueryService ✅
- [x] Create AI query pack pricing config ✅
- [x] Update FeatureGatingService to check query balance ✅
- [x] Create query pack purchase endpoints ✅
- [x] Integrate query consumption in AI services ✅
- [x] Create monthly job to reset base allowances ✅
- [x] Build query pack purchase UI ✅
- [x] Build query balance display component ✅
- [x] Add usage alerts and warnings ✅
- [x] **Admin Query Pack Price Management** ✅ (February 2, 2025)
  - Query pack prices editable in Admin Portal → Pricing
  - Prices sync to Stripe automatically when changed
  - Purchase flow uses DB prices instead of hardcoded config

### Phase 3: Testing & Documentation
- [ ] Test revenue split calculations
- [ ] Test query pack purchases
- [ ] Test query consumption and rollover
- [ ] Test monthly allowance reset
- [ ] Update API documentation
- [ ] Update user-facing documentation

---

## 🎯 Priority Order

1. **High Priority**: AI Query Caps & Packs (affects user experience)
2. **Medium Priority**: Revenue Split Updates (affects developer revenue)
3. **Low Priority**: Advanced features (rollover optimization, analytics)

---

**Last Updated**: February 2, 2025  
**Status**: Phase 2 (AI Query Caps & Packs) - COMPLETE ✅  
**Next Steps**: Phase 1 (Revenue Split Updates) or Phase 3 (Testing & Documentation)

---

## ✅ Recent Implementation: Query Pack Admin Management (February 2, 2025)

### **Query Pack Price Management in Admin Portal**

**Status**: ✅ **COMPLETE** - Query pack prices can now be managed through Admin Portal → Pricing, with automatic Stripe sync.

**What Was Implemented**:

1. **Admin UI for Query Pack Prices** ✅
   - Added query pack price fields to pricing edit modal:
     - Small Pack (500 queries)
     - Medium Pack (2,500 queries)
     - Large Pack (5,000 queries)
     - Enterprise Pack (10,000 queries)
   - Prices are editable alongside subscription tier prices
   - **File**: `web/src/app/admin-portal/pricing/page.tsx`

2. **Stripe Price Sync for Query Packs** ✅
   - When query pack prices change, Stripe prices are automatically created
   - Uses `prod_ai_query_packs` product with metadata for pack type
   - Returns Stripe sync results in API response (created/skipped/error)
   - **File**: `server/src/controllers/pricingController.ts`

3. **Database-Driven Purchase Flow** ✅
   - `GET /api/ai/queries/packs` now uses DB prices from first active tier
   - Falls back to config prices if DB prices aren't set
   - Purchase flow (`purchaseQueryPack`) uses DB prices
   - Purchase records store actual DB price used
   - **Files**: `server/src/services/aiQueryService.ts`, `server/src/controllers/aiQueryController.ts`

**How It Works**:
- Query pack prices are stored per-tier in `PricingConfig` table
- System uses first active tier's prices as "global" prices for all users
- When admin updates query pack prices for any tier, Stripe prices are created
- Purchase flow queries DB for current prices (from first active tier)
- If DB prices aren't set, falls back to hardcoded config prices

**Files Modified**:
- `server/src/controllers/pricingController.ts` - Query pack Stripe sync logic
- `server/src/services/aiQueryService.ts` - Use DB prices in purchase
- `server/src/controllers/aiQueryController.ts` - Use DB prices in getQueryPacks
- `web/src/app/admin-portal/pricing/page.tsx` - Query pack price fields in UI

**Completed At**: February 2, 2025

