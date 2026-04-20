# AI Query Overage Billing Implementation Plan (Cursor-Style)

**Date**: January 2025  
**Status**: ✅ **COMPLETE** - All Phases Implemented  
**Purpose**: Implement Cursor-style spending limit system for AI query overage billing

---

## 📋 Current System Analysis

### What Exists:
- ✅ **AI Query Balance System**: Base allowances + query pack purchases (Cursor-style)
- ✅ **Query Pack Purchases**: Users can buy additional queries ($10 for 500, $40 for 2,500, etc.)
- ✅ **Overage Billing Service**: Exists for other metrics (storage, API calls, messages, files)
- ✅ **Usage Tracking**: Tracks AI query consumption

### Current Behavior:
- When AI queries run out → **Access is BLOCKED** ("Insufficient query balance")
- Users must **manually purchase query packs** to continue
- AI queries are **excluded from overage billing** (see `usageTrackingService.ts` line 202-203)

### The Gap:
- ❌ No user-configurable spending limits
- ❌ No automatic overage billing for AI queries
- ❌ Users are blocked instead of charged automatically

---

## 🎯 Proposed Solution: Cursor-Style Spending Limits

### How It Works (Cursor Model):
1. **User Sets Spending Limit**: User configures monthly spending limit (e.g., $50/month)
2. **Base Allowance First**: Base allowance is used first (free, included in subscription)
3. **Overage Charged Against Limit**: When base allowance exhausted, queries continue but charge against spending limit
4. **Real-Time Tracking**: Spending tracked in real-time against the limit
5. **Block When Limit Reached**: Queries blocked when spending limit is reached
6. **Monthly Billing**: At end of billing period, user charged for actual usage (up to limit)
7. **Reset Next Month**: Limit resets at start of new billing period

**Example Flow**:
- User sets $50/month spending limit
- Base allowance: 1,000 queries (Pro tier)
- User uses 1,200 queries
  - First 1,000: Free (base allowance)
  - Next 200: $4.00 charged against $50 limit (200 × $0.02)
  - Remaining limit: $46.00
- User can continue using queries until $50 limit is reached
- At end of month: User billed $4.00 for overage usage

**Pros**:
- ✅ User controls spending (no surprise charges)
- ✅ Seamless experience (no blocking until limit reached)
- ✅ Clear budget management
- ✅ Matches Cursor's proven model
- ✅ Prevents runaway costs

**Cons**:
- Requires user to set limit (default to $0 = current blocking behavior)
- Need UI for limit management

---

## 💰 Pricing Strategy

### Overage Pricing:
- **Per-Query Rate**: $0.02 per query (matches query pack pricing)
- **Rationale**: Fair pricing, consistent with pack purchases

### Default Behavior:
- **Default Limit**: $0 (current blocking behavior)
- **User Must Opt-In**: Users must explicitly set a limit to enable overage
- **Can Change Anytime**: Users can adjust limit up or down during billing period

---

## 🚀 Implementation Plan

### Phase 1: Database Schema Changes (30 minutes)

#### Step 1.1: Add Spending Limit Fields to AIQueryBalance
**File**: `prisma/modules/billing/aiQueryBalance.prisma`

```prisma
model AIQueryBalance {
  // ... existing fields ...
  
  // Spending limit for overage queries (Cursor-style)
  monthlySpendingLimit Float @default(0) // Monthly limit in dollars (0 = disabled)
  currentPeriodSpending Float @default(0) // Current period spending in dollars
  
  // Overage tracking
  overageQueriesUsed Int @default(0) // Number of overage queries used this period
  overageQueriesCost Float @default(0) // Total cost of overage queries this period
}
```

**Migration**: Create migration for new fields

#### Step 1.2: Add Overage Pricing Configuration
**File**: `server/src/config/aiQueryPacks.ts`

```typescript
export const AI_QUERY_OVERAGE_CONFIG = {
  pricePerQuery: 0.02, // $0.02 per query over base allowance
  defaultLimit: 0, // Default to $0 (disabled)
};
```

---

### Phase 2: Modify AI Query Consumption Logic (1.5 hours)

#### Step 2.1: Update `consumeQuery()` to Check Spending Limit
**File**: `server/src/services/aiQueryService.ts`

**New Logic Flow**:
1. Check if base allowance + purchased queries available
2. If available, use them (existing logic)
3. If not available:
   - Check if spending limit is set (> $0)
   - If limit set: Calculate cost of overage queries
   - Check if cost fits within remaining limit
   - If yes: Allow query, track overage
   - If no: Block query (limit reached)

**Implementation**:
```typescript
static async consumeQuery(
  userId: string,
  businessId?: string | null,
  amount: number = 1
): Promise<ConsumeQueryResult> {
  // ... existing availability check ...
  
  if (!availability.available || availability.remaining < amount) {
    // Base allowance exhausted - check spending limit
    const balance = await this.getBalance(userId, businessId);
    
    if (!balance) {
      throw new Error('Balance not found');
    }
    
    // Check if spending limit is enabled
    if (balance.monthlySpendingLimit <= 0) {
      // No spending limit set - block access (current behavior)
      return { 
        success: false, 
        remaining: availability.remaining,
        error: 'Insufficient query balance. Set a spending limit to enable overage billing.' 
      };
    }
    
    // Calculate overage needed
    const overageQueries = amount - availability.remaining;
    const overageCost = overageQueries * AI_QUERY_OVERAGE_CONFIG.pricePerQuery;
    const remainingLimit = balance.monthlySpendingLimit - balance.currentPeriodSpending;
    
    // Check if overage fits within limit
    if (overageCost > remainingLimit) {
      return {
        success: false,
        remaining: availability.remaining,
        error: `Spending limit reached. Remaining limit: $${remainingLimit.toFixed(2)}. Need $${overageCost.toFixed(2)} for ${overageQueries} queries.`
      };
    }
    
    // Allow overage - update balance
    await prisma.aIQueryBalance.update({
      where: { id: balance.id },
      data: {
        overageQueriesUsed: { increment: overageQueries },
        overageQueriesCost: { increment: overageCost },
        currentPeriodSpending: { increment: overageCost },
      },
    });
    
    // Use remaining base/purchased queries first
    if (availability.remaining > 0) {
      // Consume remaining queries (existing logic)
      await this.consumeFromBalance(balance, availability.remaining);
    }
    
    return { 
      success: true, 
      remaining: -1, // Negative means using overage
    };
  }
  
  // ... existing consumption logic for base/purchased queries ...
}
```

#### Step 2.2: Add Helper Methods
**File**: `server/src/services/aiQueryService.ts`

```typescript
/**
 * Get or create balance record
 */
private static async getBalance(
  userId: string,
  businessId?: string | null
): Promise<AIQueryBalance | null> {
  // ... existing balance retrieval logic ...
}

/**
 * Set monthly spending limit for AI query overage
 */
static async setSpendingLimit(
  userId: string,
  limit: number,
  businessId?: string | null
): Promise<void> {
  const balance = await this.getBalance(userId, businessId);
  
  if (!balance) {
    throw new Error('Balance not found');
  }
  
  if (limit < 0) {
    throw new Error('Spending limit must be >= 0');
  }
  
  await prisma.aIQueryBalance.update({
    where: { id: balance.id },
    data: {
      monthlySpendingLimit: limit,
    },
  });
}

/**
 * Get current spending status
 */
static async getSpendingStatus(
  userId: string,
  businessId?: string | null
): Promise<{
  limit: number;
  currentSpending: number;
  remaining: number;
  overageQueries: number;
  overageCost: number;
}> {
  const balance = await this.getBalance(userId, businessId);
  
  if (!balance) {
    throw new Error('Balance not found');
  }
  
  return {
    limit: balance.monthlySpendingLimit,
    currentSpending: balance.currentPeriodSpending,
    remaining: Math.max(0, balance.monthlySpendingLimit - balance.currentPeriodSpending),
    overageQueries: balance.overageQueriesUsed,
    overageCost: balance.overageQueriesCost,
  };
}
```

---

### Phase 3: Update Monthly Reset Logic (30 minutes)

#### Step 3.1: Reset Spending at Start of New Period
**File**: `server/src/services/aiQueryService.ts`

Update `resetMonthlyAllowance()`:

```typescript
static async resetMonthlyAllowance(): Promise<void> {
  // ... existing reset logic ...
  
  // Reset spending for new period (keep limit, reset spending)
  await prisma.aIQueryBalance.update({
    where: { id: balance.id },
    data: {
      // ... existing reset fields ...
      currentPeriodSpending: 0,
      overageQueriesUsed: 0,
      overageQueriesCost: 0,
    },
  });
}
```

---

### Phase 4: Integrate with Overage Billing Service (1 hour)

#### Step 4.1: Add AI Query Overage to Billing
**File**: `server/src/services/overageBillingService.ts`

Add AI query overage to billing process:

```typescript
static async processOverageBilling(
  userId: string,
  businessId?: string
): Promise<{...}> {
  // ... existing logic ...
  
  // Get AI query overage from balance
  const balance = await prisma.aIQueryBalance.findFirst({
    where: {
      userId,
      businessId: businessId || null,
    },
  });
  
  if (balance && balance.overageQueriesCost > 0) {
    // Create invoice item for AI query overage
    await stripe.invoiceItems.create({
      customer: subscription.stripeCustomerId,
      amount: Math.round(balance.overageQueriesCost * 100), // Convert to cents
      currency: 'usd',
      description: `AI Query Overage: ${balance.overageQueriesUsed} queries @ $${AI_QUERY_OVERAGE_CONFIG.pricePerQuery.toFixed(2)} each`,
      metadata: {
        userId,
        businessId: businessId || '',
        metric: 'ai_queries_overage',
        quantity: balance.overageQueriesUsed.toString(),
        type: 'ai_query_overage',
      },
    });
    
    invoiceItemsCreated++;
  }
  
  // ... rest of existing logic ...
}
```

---

### Phase 5: Add API Endpoints (30 minutes)

#### Step 5.1: Spending Limit Management Endpoints
**File**: `server/src/controllers/aiQueryController.ts`

```typescript
/**
 * GET /api/ai/queries/spending
 * Get current spending status
 */
export async function getSpendingStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { businessId } = req.query;
    const businessIdParam = typeof businessId === 'string' ? businessId : null;
    
    const status = await AIQueryService.getSpendingStatus(userId, businessIdParam);
    
    res.json({ success: true, data: status });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to get spending status', {
      operation: 'ai_query_get_spending',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to get spending status' });
  }
}

/**
 * PUT /api/ai/queries/spending/limit
 * Set monthly spending limit
 */
export async function setSpendingLimit(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { limit, businessId } = req.body;
    
    if (typeof limit !== 'number' || limit < 0) {
      res.status(400).json({ error: 'Limit must be a number >= 0' });
      return;
    }
    
    const businessIdParam = typeof businessId === 'string' ? businessId : null;
    
    await AIQueryService.setSpendingLimit(userId, limit, businessIdParam);
    
    res.json({ success: true, message: 'Spending limit updated' });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to set spending limit', {
      operation: 'ai_query_set_spending_limit',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to set spending limit' });
  }
}
```

#### Step 5.2: Add Routes
**File**: `server/src/routes/ai.ts`

```typescript
router.get('/queries/spending', authenticate, aiQueryController.getSpendingStatus);
router.put('/queries/spending/limit', authenticate, aiQueryController.setSpendingLimit);
```

---

### Phase 6: Update Frontend UI (2 hours)

#### Step 6.1: Update AIQueryBalance Component
**File**: `web/src/components/AIQueryBalance.tsx`

Add spending limit section:
- Show current spending limit
- Show current period spending
- Show remaining limit
- Show overage queries used
- Button to set/adjust limit

#### Step 6.2: Add Spending Limit Modal
**File**: `web/src/components/AISpendingLimitModal.tsx` (NEW)

Create modal for setting spending limit:
- Input field for monthly limit
- Show current spending
- Show estimated queries for limit
- Save button

#### Step 6.3: Update Billing Modal
**File**: `web/src/components/BillingModal.tsx`

Add AI query overage section:
- Current overage usage
- Current period spending
- Estimated cost for remaining period

---

## 📊 Database Schema

### AIQueryBalance Model Updates:

```prisma
model AIQueryBalance {
  // ... existing fields ...
  
  // Spending limit for overage queries (Cursor-style)
  monthlySpendingLimit Float @default(0) // Monthly limit in dollars (0 = disabled)
  currentPeriodSpending Float @default(0) // Current period spending in dollars
  
  // Overage tracking
  overageQueriesUsed Int @default(0) // Number of overage queries used this period
  overageQueriesCost Float @default(0) // Total cost of overage queries this period
}
```

**Migration Required**: Yes - add 4 new fields

---

## 🔄 Billing Flow

### Monthly Billing Cycle:

1. **During Month**: Users consume queries
   - Base allowance used first (free)
   - Purchased queries used second (pre-paid)
   - Overage queries charged against spending limit (real-time tracking)
   - Queries blocked when limit reached

2. **End of Month**: Overage billing processed
   - `OverageBillingService.processOverageBilling()` called
   - Creates Stripe invoice item for `overageQueriesCost`
   - Charges appear on next invoice
   - Spending reset to 0 for new period

3. **Next Month**: Reset
   - Base allowance reset
   - Spending limit persists (user setting)
   - Current period spending reset to 0
   - Overage queries reset to 0

---

## 💡 Implementation Details

### Modified Files:

1. **`prisma/modules/billing/aiQueryBalance.prisma`**
   - Add spending limit fields

2. **`server/src/services/aiQueryService.ts`**
   - Modify `consumeQuery()` to check spending limit
   - Add `setSpendingLimit()` method
   - Add `getSpendingStatus()` method
   - Update `resetMonthlyAllowance()` to reset spending

3. **`server/src/config/aiQueryPacks.ts`**
   - Add overage pricing configuration

4. **`server/src/services/overageBillingService.ts`**
   - Add AI query overage to billing process

5. **`server/src/controllers/aiQueryController.ts`**
   - Add spending limit endpoints

6. **`server/src/routes/ai.ts`**
   - Add spending limit routes

7. **Frontend Components**:
   - Update `AIQueryBalance.tsx`
   - Create `AISpendingLimitModal.tsx`
   - Update `BillingModal.tsx`

---

## 🧪 Testing Plan

### Test Cases:

1. **Default Behavior (Limit = $0)**
   - User has no spending limit set
   - Base allowance exhausted → queries blocked
   - Matches current behavior

2. **Spending Limit Set**
   - User sets $50 limit
   - Base allowance exhausted → queries continue
   - Spending tracked correctly
   - Queries blocked when limit reached

3. **Limit Adjustment**
   - User increases limit mid-period → queries continue
   - User decreases limit mid-period → queries blocked if over new limit

4. **Monthly Reset**
   - End of month → spending reset to 0
   - Limit persists
   - New period starts fresh

5. **Billing**
   - End of month → invoice item created
   - Amount matches `overageQueriesCost`
   - Invoice appears in Stripe

---

## ⚙️ Configuration

### Environment Variables:
```bash
# Price per overage query (in dollars)
AI_QUERY_OVERAGE_PRICE=0.02
```

### Default Behavior:
- **Default Limit**: $0 (disabled)
- **User Must Opt-In**: Users must set limit to enable overage
- **Can Change Anytime**: Users can adjust limit during billing period

---

## 📈 User Experience Flow

### Setting Up Spending Limit:

1. User goes to AI Query Balance component
2. Sees "No spending limit set" message
3. Clicks "Set Spending Limit" button
4. Modal opens with:
   - Input field for monthly limit
   - Preview: "This allows ~X queries/month at $0.02/query"
   - Current period spending (if any)
5. User enters limit (e.g., $50)
6. Saves → limit is set
7. Overage billing enabled

### Using Queries:

1. Base allowance used first (free)
2. When base exhausted:
   - Warning shown: "Using overage queries - $X.XX remaining"
   - Queries continue
   - Spending tracked in real-time
3. When limit reached:
   - Error: "Spending limit reached. Increase limit to continue."
   - Queries blocked

### Monitoring:

1. AI Query Balance component shows:
   - Base allowance usage
   - Purchased queries
   - Overage queries used
   - Current spending
   - Remaining limit
   - Progress bar for limit

---

## ✅ Success Criteria

- [ ] Users can set monthly spending limit
- [ ] Base allowance used first (free)
- [ ] Overage queries charged against limit
- [ ] Real-time spending tracking
- [ ] Queries blocked when limit reached
- [ ] Monthly billing for overage usage
- [ ] Spending resets at start of new period
- [ ] Frontend UI for limit management
- [ ] Clear warnings and status indicators

---

## 📅 Estimated Timeline

- **Phase 1**: 30 minutes (database schema)
- **Phase 2**: 1.5 hours (consumption logic)
- **Phase 3**: 30 minutes (reset logic)
- **Phase 4**: 1 hour (billing integration)
- **Phase 5**: 30 minutes (API endpoints)
- **Phase 6**: 2 hours (frontend UI)
- **Testing**: 1 hour

**Total**: ~7 hours

---

## 🚨 Important Considerations

### 1. Default Behavior
- **Default limit = $0**: Maintains current blocking behavior
- **User opt-in**: Users must explicitly enable overage
- **No surprise charges**: Clear communication about costs

### 2. Real-Time Tracking
- **Immediate updates**: Spending tracked as queries are consumed
- **Accurate calculations**: Cost calculated per query
- **Limit enforcement**: Block queries when limit reached

### 3. Enterprise Tier
- Enterprise users have unlimited queries
- No spending limit needed
- No overage billing

### 4. User Communication
- **Clear warnings**: Show when using overage
- **Progress indicators**: Show spending vs limit
- **Cost transparency**: Show per-query cost clearly

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 (Database Schema Changes)
