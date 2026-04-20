# Billing & Payment System - Implementation Plan

**Date**: January 2025  
**Status**: In Progress - Phases 0.1, 0.2, 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 Complete ✅  
**Purpose**: Complete implementation plan for billing & payment system

**Completed Phases**:
- ✅ **Phase 0.1**: Database-Driven Pricing
- ✅ **Phase 0.2**: Admin Portal Pricing Management UI
- ✅ **Phase 1.1**: AI Query Caps & Query Packs
- ✅ **Phase 1.3**: AI Query Overage Billing (Cursor-Style Spending Limits)
- ✅ **Phase 1.2**: Developer Revenue Split (Apple Model)
- ✅ **Phase 2.1**: Verify & Complete Payment Flow
- ✅ **Phase 2.2**: Payment Method Management
- ✅ **Phase 2.3**: Usage Limits & Overage Enforcement
- ✅ **Phase 2.4**: Subscription Lifecycle UI
- ✅ **Phase 2.5**: Stripe Price Points & Per-Employee Pricing Integration
- ✅ **Phase 2.6**: Financial Management Page - Full Stripe Integration
- ✅ **Configuration Fixes**: Stripe configuration, TypeScript errors, database connection, plan filtering

---

## 🔧 Configuration & Troubleshooting Fixes (January 2025)

### ✅ Completed Fixes

#### Stripe Configuration
- **Fixed `isStripeConfigured()` Function**: Updated to only check for `STRIPE_SECRET_KEY` (backend doesn't need publishable key)
  - Location: `server/src/config/stripe.ts`
  - Issue: Function was checking for both secret and publishable keys, causing false negatives
  - Fix: Backend only needs secret key; publishable key is frontend-only

#### TypeScript API Version Errors
- **Fixed Stripe API Version Type Errors**: Added type assertions across all Stripe service files
  - Files Fixed:
    - `server/src/config/stripe.ts`
    - `server/src/services/aiQueryService.ts`
    - `server/src/services/developerPortalService.ts`
    - `server/src/services/overageBillingService.ts`
    - `server/src/services/moduleSubscriptionService.ts`
    - `server/src/services/subscriptionService.ts`
  - Issue: TypeScript types lag behind Stripe API versions (types expect `2025-07-30.basil`, we use `2025-08-27.basil`)
  - Fix: Added `as any` type assertion with comment explaining why

#### Prisma Schema Errors
- **Fixed `DeveloperRevenue` Creation**: Added missing required fields
  - Location: `server/src/services/developerPortalService.ts`
  - Issue: `requestPayout()` was missing required fields: `commissionRate`, `commissionType`, `subscriptionAgeMonths`, `isFirstYear`
  - Fix: Added default values for manual payouts (not revenue split calculations)

#### Database Connection
- **Fixed DATABASE_URL Configuration**: Restored correct database connection string
  - Issue: `.env` file was overwritten during Stripe key setup
  - Fix: Restored from root `.env` file with correct connection string
- **Improved Logger Error Handling**: Added graceful database connection error handling
  - Location: `server/src/lib/logger.ts`
  - Issue: Logger would crash application if database connection failed
  - Fix: Wrapped `prisma.log.create` in try-catch to prevent crashes

#### UI Enhancements
- **Dynamic Plan Filtering**: Personal users see only personal plans, business users see only business plans
  - Location: `web/src/components/PlanComparison.tsx`, `web/src/components/BillingModal.tsx`
  - Implementation: Added `userType` prop to filter tiers based on `businessId` presence
- **White-Labeled Payment Management**: In-app payment method addition using Stripe Elements
  - Location: `web/src/components/AddPaymentMethodModal.tsx`
  - Features: Secure card collection, SetupIntent integration, real-time validation

---

## Phase 2.5: Stripe Price Points & Per-Employee Pricing Integration (January 2025) ✅ COMPLETE

**Status**: ✅ **COMPLETE** - Full Stripe Integration for All Pricing Components

### What Was Accomplished

#### Per-Employee Pricing Stripe Integration ✅
- **Database Schema Update**: Added `perEmployeeStripePriceId` to `PricingConfig` model
  - Location: `prisma/modules/billing/pricingConfig.prisma`
  - Stores Stripe Price ID for per-employee charges
  - Schema synced to database using `prisma db push`
- **Admin Portal UI Updates**:
  - Removed business-tier restriction for per-employee fields (now available for all tiers)
  - Added separate "Monthly" and "Yearly" edit buttons for each tier
  - Added placeholders and help text for per-employee fields
  - Location: `web/src/app/admin-portal/pricing/page.tsx`
- **Automatic Stripe Price Creation**:
  - When `perEmployeePrice` changes in admin portal, automatically creates new Stripe price
  - Stores `perEmployeeStripePriceId` in database for future reference
  - Location: `server/src/controllers/pricingController.ts`
- **Subscription Creation with Per-Employee Pricing**:
  - Updated `SubscriptionService.createSubscription()` to include per-employee items
  - Calculates `additionalEmployees` and `additionalEmployeeCost` based on `pricingConfig`
  - Creates Stripe subscriptions with multiple items (base price + per-employee price with quantity)
  - Location: `server/src/services/subscriptionService.ts`
- **Employee Count Updates**:
  - Added `updateEmployeeCount()` method to update employee count on existing subscriptions
  - Updates Stripe subscription items with proration when employee count changes
  - Added API endpoint: `PUT /api/billing/subscriptions/:id/employee-count`
  - Location: `server/src/services/subscriptionService.ts`, `server/src/controllers/billingController.ts`
- **Sync Scripts**:
  - Created `listStripePerEmployeePrices.ts` to list all per-employee prices in Stripe
  - Created `syncPerEmployeeStripePrices.ts` to sync existing per-employee prices to Stripe
  - Added npm scripts: `stripe:list-per-employee`, `stripe:sync-per-employee`
  - Location: `server/src/scripts/`

#### AI Query Overage Billing Period Fixes ✅
- **Cron Job Update**: Changed from monthly (1st of month) to daily (3am ET)
  - Reason: Subscriptions have varying billing periods, not all on 1st
  - Location: `server/src/index.ts`
- **Subscription-Based Billing Periods**:
  - Updated `OverageBillingService.processAllOverageBilling()` to filter by subscription `currentPeriodEnd`
  - Only processes subscriptions whose billing period has ended
  - Prevents duplicate processing by checking for existing Stripe invoice items with matching `periodEnd` metadata
  - Location: `server/src/services/overageBillingService.ts`

#### AI Query Pack Stripe Integration ✅
- **Stripe Products & Prices Setup**:
  - Created Stripe Product: `prod_ai_query_packs` for AI Query Packs
  - Created one-time Stripe Prices for each pack:
    - Small Pack: `price_1SlXYeI7vbumyzaWOVTH2TKp` - $10.00 (500 queries)
    - Medium Pack: `price_1SlXYeI7vbumyzaW9HEBZYxp` - $40.00 (2,500 queries)
    - Large Pack: `price_1SlXYeI7vbumyzaWmHUg1o3u` - $70.00 (5,000 queries)
    - Enterprise Pack: `price_1SlXYfI7vbumyzaWTOb6rtjI` - $120.00 (10,000 queries)
  - Created setup script: `setupQueryPackProducts.ts`
  - Created sync script: `syncQueryPackPrices.ts`
  - Added npm scripts: `stripe:setup-query-packs`, `stripe:sync-query-pack-prices`
  - Location: `server/src/scripts/`, `server/src/config/aiQueryPacks.ts`
- **Webhook Handler Updates**:
  - Added `handlePaymentIntentSucceeded()` to process successful query pack purchases
  - Added `handlePaymentIntentFailed()` to handle failed purchases
  - Calls `AIQueryService.completeQueryPackPurchase()` and `AIQueryService.failQueryPackPurchase()`
  - Location: `server/src/services/stripeService.ts`
- **Query Pack Purchase Flow**:
  - Updated `AIQueryService.purchaseQueryPack()` to use Stripe Price IDs from config
  - Stores `stripePriceId` in purchase metadata for reference
  - Location: `server/src/services/aiQueryService.ts`

#### Price Change Behavior ✅
- **No Proration**: When updating existing subscriptions to new prices, `proration_behavior: 'none'` is set
  - New prices take effect on next billing cycle
  - No immediate charges or credits
  - Location: `server/src/controllers/pricingController.ts`

### Files Modified
- `prisma/modules/billing/pricingConfig.prisma` - Added `perEmployeeStripePriceId` field
- `web/src/app/admin-portal/pricing/page.tsx` - UI updates for yearly and per-employee pricing
- `server/src/controllers/pricingController.ts` - Automatic Stripe price creation, no proration
- `server/src/services/stripeService.ts` - Added metadata support, query pack webhook handlers
- `server/src/services/subscriptionService.ts` - Per-employee pricing in subscriptions, employee count updates
- `server/src/services/overageBillingService.ts` - Subscription-based billing periods, duplicate prevention
- `server/src/services/aiQueryService.ts` - Stripe Price ID integration for query packs
- `server/src/index.ts` - Updated cron job schedule
- `server/src/config/aiQueryPacks.ts` - Added `stripeProductId` and `stripePriceId` fields
- `server/src/scripts/setupQueryPackProducts.ts` - NEW: Query pack Stripe setup
- `server/src/scripts/syncQueryPackPrices.ts` - NEW: Query pack price sync
- `server/src/scripts/listStripePerEmployeePrices.ts` - NEW: List per-employee prices
- `server/src/scripts/syncPerEmployeeStripePrices.ts` - NEW: Sync per-employee prices
- `server/package.json` - Added npm scripts for new operations

### What This Enables
- Complete Stripe integration for all pricing components (base, per-employee, query packs)
- Dynamic pricing updates in admin portal that automatically sync to Stripe
- Per-employee pricing for all tiers (not just business)
- Accurate overage billing based on individual subscription periods
- Query pack purchases fully integrated with Stripe payment intents
- No proration when prices change (changes apply on next billing cycle)

### Environment Variables Required
```bash
# Per-employee prices are stored in database (perEmployeeStripePriceId)
# Query pack prices (add to server/.env):
STRIPE_QUERY_PACK_SMALL_PRICE_ID=price_1SlXYeI7vbumyzaWOVTH2TKp
STRIPE_QUERY_PACK_MEDIUM_PRICE_ID=price_1SlXYeI7vbumyzaW9HEBZYxp
STRIPE_QUERY_PACK_LARGE_PRICE_ID=price_1SlXYeI7vbumyzaWmHUg1o3u
STRIPE_QUERY_PACK_ENTERPRISE_PRICE_ID=price_1SlXYfI7vbumyzaWTOb6rtjI
```

**Completed At**: January 2025 - Ready for production use

---

## Phase 2.6: Financial Management Page - Full Stripe Integration (January 2025) ✅ COMPLETE

**Status**: ✅ **COMPLETE** - Full Stripe Integration with Real-Time Sync Capabilities

### What Was Accomplished

#### Database Schema Enhancements ✅
- **Invoice Model Updates**: Added comprehensive Stripe fee and refund tracking
  - `stripeFee` (Float) - Stripe processing fees
  - `stripeNetAmount` (Float) - Net amount after fees
  - `refundAmount` (Float) - Total refunded amount
  - `refundCount` (Int) - Number of refunds
  - `stripeChargeId`, `stripePaymentIntentId`, `stripeCustomerId` - Stripe IDs
  - `lastSyncedAt` (DateTime) - Last sync timestamp
  - `stripeMetadata` (Json) - Additional Stripe data
  - Location: `prisma/modules/billing/subscriptions.prisma`
- **Subscription Model Updates**: Added Stripe sync tracking
  - `lastSyncedAt` (DateTime) - Last sync timestamp
  - `stripeMetadata` (Json) - Additional Stripe subscription data
  - Location: `prisma/modules/billing/subscriptions.prisma`
- **Refund Model** (NEW): Created dedicated refund tracking model
  - Tracks individual refunds with amounts, reasons, status
  - Links to invoices and stores Stripe refund IDs
  - Location: `prisma/modules/billing/subscriptions.prisma`

#### Backend Stripe Sync Service ✅
- **StripeSyncService** (NEW): `server/src/services/stripeSyncService.ts`
  - `syncSubscriptionFromStripe()` - Syncs individual subscription from Stripe API
  - `syncInvoiceFromStripe()` - Syncs invoice with fees and refunds
  - `syncAllSubscriptions()` - Batch sync all subscriptions
  - `syncInvoicesForSubscription()` - Sync all invoices for a subscription
  - `getStripeSubscriptionUrl()` - Generates Stripe Dashboard URLs
  - `getStripeInvoiceUrl()` - Generates Stripe Dashboard URLs
  - `getStripeCustomerUrl()` - Generates Stripe Dashboard URLs
  - Fetches Stripe fees from balance transactions
  - Tracks and stores refunds in database
  - Stores comprehensive Stripe metadata in JSON fields

#### API Endpoints ✅
- **Sync Endpoints**:
  - `POST /api/admin-portal/billing/subscriptions/:id/sync` - Sync single subscription
  - `POST /api/admin-portal/billing/invoices/:id/sync` - Sync single invoice
  - `POST /api/admin-portal/billing/subscriptions/sync-all` - Sync all subscriptions
- **Enhanced Data Endpoints**:
  - `GET /api/admin-portal/billing/subscriptions/:id/enhanced` - Get subscription with Stripe URLs
  - `GET /api/admin-portal/billing/invoices/:id/enhanced` - Get invoice with fees, refunds, URLs
- **Updated List Endpoints**:
  - `GET /api/admin-portal/billing/subscriptions` - Now includes Stripe URLs
  - `GET /api/admin-portal/billing/payments` - Now includes fees, refunds, Stripe URLs
  - Location: `server/src/routes/admin-portal.ts`, `server/src/services/adminService.ts`

#### Frontend Enhancements ✅
- **Financial Management Page Updates**: `web/src/app/admin-portal/billing/page.tsx`
  - Added "Sync All from Stripe" button in header
  - Individual sync buttons for each subscription and invoice
  - Stripe Dashboard links (ExternalLink icon) for quick navigation
  - Enhanced payment display with:
    - Stripe fees column
    - Refund amounts and counts
    - Net amounts (after fees)
    - Last synced timestamp
  - Loading states and error handling for sync operations
  - Real-time data refresh after sync operations
- **API Service Updates**: `web/src/lib/adminApiService.ts`
  - Added `syncSubscriptionFromStripe()` method
  - Added `syncInvoiceFromStripe()` method
  - Added `syncAllSubscriptions()` method
  - Added `getEnhancedSubscription()` method
  - Added `getEnhancedInvoice()` method

### Files Modified
- `prisma/modules/billing/subscriptions.prisma` - Added fee, refund, and metadata fields
- `server/src/services/stripeSyncService.ts` - NEW: Complete Stripe sync service
- `server/src/routes/admin-portal.ts` - Added sync and enhanced endpoints
- `server/src/services/adminService.ts` - Updated to include Stripe URLs and fees
- `web/src/app/admin-portal/billing/page.tsx` - Enhanced UI with sync and Stripe links
- `web/src/lib/adminApiService.ts` - Added sync and enhanced data methods

### What This Enables
- Complete visibility into Stripe financial data from admin portal
- Real-time synchronization with Stripe for accurate data
- Fee and refund tracking for accurate revenue reporting
- Quick navigation to Stripe Dashboard for detailed investigation
- Manual control over data freshness
- Comprehensive financial management capabilities

**Completed At**: January 2025 - Ready for production use

---

## 📊 Current Implementation Status

### ✅ What's Already Implemented

#### Database Schema (COMPLETE)
- ✅ **Subscription Model**: `prisma/modules/billing/subscriptions.prisma`
  - Core subscriptions (free, pro, business_basic, business_advanced, enterprise)
  - Business-specific fields (employeeCount, includedEmployees, additionalEmployeeCost)
  - Stripe integration fields (stripeSubscriptionId, stripeCustomerId)
  - Relationships to User, Business, UsageRecord, Invoice
- ✅ **ModuleSubscription Model**: Module-specific subscriptions (App Store model)
- ✅ **UsageRecord Model**: Usage tracking for both core tiers and modules
- ✅ **Invoice Model**: Invoice management with Stripe integration
- ✅ **DeveloperRevenue Model**: Revenue tracking for third-party modules (Phase 1.2)
  - Commission rate and type tracking
  - Subscription age tracking
  - First year flag
- ✅ **PricingConfig Model**: `prisma/modules/billing/pricingConfig.prisma` (Phase 0.1)
  - Database-driven pricing for all tiers and cycles
  - AI query pack pricing
  - Base AI allowances
  - Stripe price ID integration
- ✅ **PriceChange Model**: `prisma/modules/billing/pricingConfig.prisma` (Phase 0.1)
  - Price change history and audit trail
  - Notification tracking
- ✅ **AIQueryBalance Model**: `prisma/modules/billing/aiQueryBalance.prisma` (Phase 1.1, 1.3)
  - Query balance tracking for users and businesses
  - Base allowance and purchased queries
  - Rollover tracking
  - Spending limit fields (Phase 1.3):
    - `monthlySpendingLimit` - User-configurable monthly limit
    - `currentPeriodSpending` - Real-time spending tracking
    - `overageQueriesUsed` - Number of overage queries this period
    - `overageQueriesCost` - Total cost of overage queries
- ✅ **AIQueryPurchase Model**: `prisma/modules/billing/aiQueryPurchase.prisma` (Phase 1.1)
  - Query pack purchase history
  - Stripe payment intent tracking
- ✅ **Refund Model**: `prisma/modules/billing/subscriptions.prisma` (Phase 2.6)
  - Individual refund tracking with amounts, reasons, status
  - Links to invoices and stores Stripe refund IDs
- ✅ **Invoice Model Updates**: `prisma/modules/billing/subscriptions.prisma` (Phase 2.6)
  - Stripe fee tracking (`stripeFee`, `stripeNetAmount`)
  - Refund tracking (`refundAmount`, `refundCount`)
  - Additional Stripe IDs (`stripeChargeId`, `stripePaymentIntentId`, `stripeCustomerId`)
  - Sync tracking (`lastSyncedAt`, `stripeMetadata`)
- ✅ **Subscription Model Updates**: `prisma/modules/billing/subscriptions.prisma` (Phase 2.6)
  - Stripe sync tracking (`lastSyncedAt`, `stripeMetadata`)
- ✅ **Module Model Updates**: `prisma/modules/business/modules.prisma` (Phase 1.2)
  - `totalLifetimeRevenue` field
  - `smallBusinessEligible` field
- ✅ **Migration**: `20250804005004_add_billing_subscription_models` applied

#### Backend Services (COMPLETE)
- ✅ **SubscriptionService**: `server/src/services/subscriptionService.ts`
  - Create, get, update, cancel, reactivate subscriptions
  - Stripe integration for paid tiers
  - Usage tracking and recording
  - Webhook handling (payment succeeded/failed, subscription deleted)
- ✅ **ModuleSubscriptionService**: `server/src/services/moduleSubscriptionService.ts`
  - Module-specific subscription management
  - Developer revenue tracking with dynamic revenue split
  - Webhook handling for module subscriptions
- ✅ **StripeService**: `server/src/services/stripeService.ts`
  - Customer creation and management
  - Subscription creation
  - Payment intent creation
  - Checkout session creation
  - Payment method management (list, create, delete, set default)
  - Customer portal session creation
  - Price and product management
  - Webhook event handling
- ✅ **PaymentService**: `server/src/services/paymentService.ts`
  - Module payment intent creation
  - Module subscription management
  - Webhook handling
- ✅ **FeatureGatingService**: `server/src/services/featureGatingService.ts`
  - Tier-based feature access control
  - Usage limit checking
  - Feature configuration per tier
  - AI query balance checking
- ✅ **PricingService**: `server/src/services/pricingService.ts` (Phase 0.1)
  - Database-driven pricing management
  - Pricing cache for performance
  - Price change history tracking
  - Impact analysis calculations
- ✅ **RevenueSplitService**: `server/src/services/revenueSplitService.ts` (Phase 1.2)
  - Apple App Store model revenue split (30% standard, 15% small business/long-term)
  - Developer lifetime revenue calculation
  - Developer eligibility updates
- ✅ **AIQueryService**: `server/src/services/aiQueryService.ts` (Phase 1.1, 1.3, 2.5)
  - AI query balance management
  - Query consumption tracking
  - Query pack purchase handling
  - Monthly allowance reset with rollover
  - Spending limit management (Phase 1.3):
    - `setSpendingLimit()` - Set monthly spending limit
    - `getSpendingStatus()` - Get current spending status
    - Spending limit checking in `consumeQuery()`
    - Real-time spending tracking
  - Stripe Price ID integration for query packs (Phase 2.5):
    - Uses `stripePriceId` from `AI_QUERY_PACKS` config
    - Stores `stripePriceId` in purchase metadata
- ✅ **UsageTrackingService**: `server/src/services/usageTrackingService.ts` (Phase 2.3)
  - Centralized usage tracking for all metrics
  - Usage limit enforcement
  - Overage calculation
  - Usage alerts generation
- ✅ **OverageBillingService**: `server/src/services/overageBillingService.ts` (Phase 2.3, 2.5)
  - Monthly overage billing processing
  - Stripe invoice item creation for overages
  - Subscription-based billing periods (Phase 2.5):
    - Daily cron job (3am ET) instead of monthly
    - Filters by subscription `currentPeriodEnd`
    - Duplicate prevention via existing invoice item checks
- ✅ **StripeSyncService**: `server/src/services/stripeSyncService.ts` (Phase 2.6)
  - Sync subscriptions and invoices from Stripe API
  - Fetch and store Stripe fees from balance transactions
  - Track and store refunds in database
  - Generate Stripe Dashboard URLs
  - Store comprehensive Stripe metadata

#### Backend Controllers & Routes (COMPLETE)
- ✅ **BillingController**: `server/src/controllers/billingController.ts`
  - Core subscription CRUD (create, get, update, cancel, reactivate)
  - Module subscription CRUD
  - Usage tracking (get, record)
  - Invoice management (get, get by ID)
  - Developer revenue endpoints
  - Checkout session creation (Phase 2.1)
  - Payment method management (Phase 2.2)
  - Customer portal session creation (Phase 2.2)
- ✅ **Billing Routes**: `server/src/routes/billing.ts`
  - All endpoints registered and functional
  - `/api/billing/subscriptions/*`
  - `/api/billing/modules/*`
  - `/api/billing/usage/*`
  - `/api/billing/invoices/*`
  - `/api/billing/developer/revenue`
  - `/api/billing/checkout/session` (Phase 2.1)
  - `/api/billing/payment-methods/*` (Phase 2.2)
  - `/api/billing/customer-portal` (Phase 2.2)
- ✅ **PricingController**: `server/src/controllers/pricingController.ts` (Phase 0.1)
  - Pricing CRUD (get all, get by tier, create/update)
  - Price history endpoints
  - Impact analysis endpoint
  - Cache management endpoint
- ✅ **Pricing Routes**: `server/src/routes/pricing.ts` (Phase 0.1)
  - `/api/pricing` - Get all pricing
  - `/api/pricing/:tier` - Get pricing for tier
  - `/api/pricing/:tier/info` - Get pricing info
  - `/api/pricing` (POST) - Create/update pricing
  - `/api/pricing/history/all` - Get price history
  - `/api/pricing/calculate-impact` - Calculate impact
  - `/api/pricing/clear-cache` - Clear pricing cache
- ✅ **AIQueryController**: `server/src/controllers/aiQueryController.ts` (Phase 1.1, 1.3)
  - `/api/ai/queries/balance` - Get query balance
  - `/api/ai/queries/consume` - Consume queries (internal)
  - `/api/ai/queries/purchase` - Purchase query pack
  - `/api/ai/queries/purchases` - Get purchase history
  - `/api/ai/queries/packs` - Get available query packs
  - `/api/ai/queries/spending` - Get spending status (Phase 1.3)
  - `/api/ai/queries/spending/limit` - Set spending limit (Phase 1.3)
  - `/api/ai/queries/webhook` - Stripe webhook handler
- ✅ **UsageTrackingController**: `server/src/controllers/usageTrackingController.ts` (Phase 2.3)
  - `/api/usage` - Get all usage
  - `/api/usage/:metric` - Get usage by metric
  - `/api/usage/alerts/list` - Get usage alerts
  - `/api/usage/overage/cost` - Get overage cost

#### Frontend UI (PARTIALLY COMPLETE)
- ✅ **BillingModal**: `web/src/components/BillingModal.tsx`
  - Overview tab (current subscription, plan details)
  - Plans tab (plan comparison and upgrade flow) - Phase 2.4
  - Payment Methods tab (payment method management) - Phase 2.2
  - Query Packs tab (AI query balance and purchases) - Phase 1.1, 1.3
  - Modules tab (module subscriptions)
  - Usage tab (usage data display)
  - Invoices tab (invoice list)
  - Size updated to xlarge for better visibility (Phase 1.3)
- ✅ **AIQueryBalance**: `web/src/components/AIQueryBalance.tsx` (Phase 1.1, 1.3)
  - Query balance display with breakdown
  - Spending limit status display (Phase 1.3)
  - Progress bars for usage and spending
  - Overage warnings and information
- ✅ **AISpendingLimitModal**: `web/src/components/AISpendingLimitModal.tsx` (Phase 1.3)
  - Spending limit management modal
  - Current period spending display
  - Estimated queries calculator
  - Warning when decreasing limit below current spending
- ✅ **Admin Billing Page**: `web/src/app/admin-portal/billing/page.tsx`
  - Subscriptions management
  - Payments tracking
  - Developer payouts
  - Financial overview
- ✅ **Business Billing**: Integrated in business admin page
  - Subscription display
  - Basic billing information

#### Stripe Integration (COMPLETE)
- ✅ **Stripe Configuration**: `server/src/config/stripe.ts`
  - API key configuration
  - Webhook events defined
  - Revenue split configuration
- ✅ **Webhook Handlers**: Multiple services handle webhooks
  - SubscriptionService.handleStripeWebhook()
  - ModuleSubscriptionService.handleStripeWebhook()
  - StripeService.handleWebhookEvent()
  - PaymentService.handleWebhookEvent()

---

## ❌ What's Missing

### Phase 4.1: Foundation - ✅ COMPLETE
All foundation work is done:
- ✅ Database schema
- ✅ Stripe integration
- ✅ Basic subscription management
- ✅ Usage tracking system
- ✅ Tier-based feature flags

### Pricing & Revenue Model Updates - ✅ COMPLETE
- ✅ **Developer Revenue Split**: Complete - Apple App Store model implemented (30% standard, 15% small business/long-term) - Phase 1.2
- ✅ **AI Usage Caps**: Complete - Pro tier has base allowance (1,000 queries/month) + query pack purchases (Cursor-style) - Phase 1.1
- ✅ **Query Pack System**: Complete - Purchase flow, balance tracking, rollover logic implemented - Phase 1.1
- ✅ **Database-Driven Pricing**: Complete - Pricing management system with admin UI - Phase 0.1 & 0.2

### Phase 4.2: Standard Tier - ⚠️ NEEDS VERIFICATION
- ⚠️ **$49.99/month subscription**: Backend exists, need to verify pricing configuration
- ⚠️ **AI feature gating**: FeatureGatingService exists, need to verify all AI features are gated
- ⚠️ **Usage limits and overage charges**: Backend exists, need to verify UI and enforcement
- ⚠️ **Payment processing**: Stripe integration exists, need to verify checkout flow
- ✅ **Subscription lifecycle management**: Complete - UI flows implemented (Phase 2.4)

### Phase 4.3: Enterprise Tier - ⚠️ PARTIALLY MISSING
- ⚠️ **Enterprise organization management**: Backend exists, need enterprise-specific UI
- ⚠️ **Multi-user billing**: Backend supports it, need enterprise admin dashboard
- ⚠️ **Custom pricing workflows**: Not implemented
- ⚠️ **Volume discounts**: Not implemented
- ⚠️ **Add-on management**: Not implemented
- ⚠️ **Advanced analytics**: Basic exists, need enterprise-level reporting

### Phase 4.4: Advanced Features - ❌ MOSTLY MISSING
- ❌ **Advanced usage analytics**: Basic usage display exists, need charts/insights
- ❌ **Predictive billing**: Not implemented
- ❌ **Cost optimization**: Not implemented
- ❌ **Automated invoice generation**: Backend exists, need automated triggers
- ❌ **Payment recovery (dunning)**: Not implemented
- ❌ **White-label options**: Not implemented
- ❌ **Custom deployment options**: Not implemented

### Frontend Enhancements Needed
- ✅ **Payment Method Management**: Complete UI for managing payment methods (Phase 2.2)
- ❌ **Invoice Download**: No PDF generation or download functionality
- ❌ **Payment History**: Basic invoice list exists, need detailed transaction history
- ✅ **Upgrade/Downgrade Flow**: Complete UI with wizard-style flow (Phase 2.4)
- ✅ **Plan Comparison**: Complete feature comparison table (Phase 2.4)
- ❌ **Usage Charts**: Basic usage display, need visualizations
- ✅ **Overage Alerts**: Complete usage alerts with warnings (Phase 2.3)
- ❌ **Billing Settings**: No dedicated settings page

### Webhook Integration
- ⚠️ **Webhook Endpoint**: Need to verify webhook route exists
- ⚠️ **Webhook Security**: Need to verify signature verification
- ⚠️ **Webhook Testing**: Need to verify test webhook handling

---

## 🎯 Implementation Plan

### Phase 0: Pricing Management System (Week 1) - HIGHEST PRIORITY

**Why First**: Enables quick pricing updates without code changes, critical for business operations.

#### 0.1 Database-Driven Pricing ✅ COMPLETE
**Priority**: Critical  
**Estimated Time**: 2-3 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Create PricingConfig and PriceChange database models
- [x] Create migration for pricing models
- [x] Migrate hardcoded pricing from `stripe.ts` to database
- [x] Create PricingService that reads from database
- [x] Add pricing version history/audit trail
- [x] Create pricing cache for performance
- [x] Update all services to use database pricing

**Implementation Summary**:
- **Database**: Created `PricingConfig` and `PriceChange` models in `prisma/modules/billing/pricingConfig.prisma`
- **Service**: `server/src/services/pricingService.ts` - Complete pricing management with caching
- **Controller**: `server/src/controllers/pricingController.ts` - Full CRUD endpoints
- **Routes**: `server/src/routes/pricing.ts` - API routes registered
- **Seed Script**: `server/src/scripts/seedPricing.ts` - Seeds initial pricing data
- **Integration**: `server/src/config/stripe.ts` - Updated to use PricingService with fallback

**Database Schema**:
```prisma
model PricingConfig {
  id              String   @id @default(uuid())
  tier            String   // 'free', 'pro', 'business_basic', etc.
  billingCycle    String   // 'monthly', 'yearly'
  
  // Pricing
  basePrice       Float
  perEmployeePrice Float?  // For business tiers
  includedEmployees Int?   // For business tiers
  
  // AI Query Packs
  queryPackSmall  Float?   // 500 queries
  queryPackMedium Float?   // 2,500 queries
  queryPackLarge  Float?   // 5,000 queries
  queryPackEnterprise Float? // 10,000 queries
  
  // Base AI Allowances
  baseAIAllowance Int?    // Queries included per month
  
  // Stripe Integration
  stripePriceId   String?  // Stripe price ID
  
  // Status
  isActive        Boolean  @default(true)
  effectiveDate   DateTime // When this pricing takes effect
  endDate         DateTime? // When this pricing expires (for future changes)
  
  // Metadata
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relationships
  createdByUser   User     @relation(fields: [createdBy], references: [id])
  priceChanges    PriceChange[]
  
  @@unique([tier, billingCycle, effectiveDate])
  @@index([tier, isActive])
  @@index([effectiveDate])
}

model PriceChange {
  id              String   @id @default(uuid())
  pricingConfigId String
  changeType      String   // 'base_price', 'per_employee', 'query_pack', etc.
  oldValue        Float
  newValue        Float
  reason          String?
  notificationSent Boolean @default(false)
  notificationSentAt DateTime?
  
  createdBy       String
  createdAt       DateTime @default(now())
  
  pricingConfig   PricingConfig @relation(fields: [pricingConfigId], references: [id])
  createdByUser   User     @relation(fields: [createdBy], references: [id])
  
  @@index([pricingConfigId])
  @@index([createdAt])
}
```

**Files to Create**:
- `server/src/services/pricingService.ts` - NEW: Centralized pricing service
- `prisma/modules/billing/pricingConfig.prisma` - NEW: Pricing models

**Files to Modify**:
- `server/src/config/stripe.ts` - Read from database instead of hardcoded PRICING_CONFIG
- `server/src/services/subscriptionService.ts` - Use PricingService
- `server/src/services/moduleSubscriptionService.ts` - Use PricingService
- `server/src/services/aiQueryService.ts` - Use PricingService for query packs (when implemented)

**Migration Steps**:
1. Create Prisma models in `prisma/modules/billing/pricingConfig.prisma`
2. Run `pnpm prisma:build` to rebuild schema
3. Run `pnpm prisma migrate dev --name add_pricing_management` to create migration
4. Seed database with current pricing from `stripe.ts`
5. Update services to use PricingService
6. Remove hardcoded PRICING_CONFIG from `stripe.ts`

#### 0.2 Admin Portal Pricing Management UI ✅ COMPLETE
**Priority**: Critical  
**Estimated Time**: 3-4 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Create pricing management page in admin portal
- [x] Build pricing table with all tiers and cycles
- [x] Add inline editing for prices
- [x] Show pricing history and changes
- [x] Add effective date scheduling (future price changes)
- [x] Display impact analysis (affected users, revenue impact)
- [x] Add validation and confirmation dialogs
- [x] Add Stripe sync status indicator

**Implementation Summary**:
- **Admin Page**: `web/src/app/admin-portal/pricing/page.tsx` - Complete pricing management UI
- **Features**: Overview table, inline editing, price history, impact analysis, email notifications toggle
- **Integration**: Added to admin portal navigation menu
- **API Integration**: Full integration with pricing API endpoints

**UI Features**:
- **Pricing Overview Table**: All tiers, monthly/yearly, current vs future pricing
- **Quick Edit**: Inline editing with validation
- **Bulk Update**: Update multiple prices at once
- **Price History**: Timeline of all price changes
- **Impact Preview**: Shows how many users will be affected
- **Stripe Sync Status**: Shows if Stripe prices are in sync

**Files to Create**:
- `web/src/app/admin-portal/pricing/page.tsx` - NEW: Pricing management page
- `web/src/components/admin/PricingTable.tsx` - NEW: Pricing table component
- `web/src/components/admin/PricingEditor.tsx` - NEW: Price editing modal
- `web/src/components/admin/PriceHistory.tsx` - NEW: Price change history
- `web/src/components/admin/PriceImpactAnalysis.tsx` - NEW: Impact preview
- `web/src/lib/pricingApiService.ts` - NEW: Pricing API client

**Files to Modify**:
- `web/src/app/admin-portal/layout.tsx` - Add pricing menu item (after "Financial Management")
- `web/src/lib/adminApiService.ts` - Add pricing methods

#### 0.3 Stripe Price Synchronization
**Priority**: Critical  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create service to sync database prices to Stripe
- [ ] Update Stripe prices when database prices change
- [ ] Handle price updates for existing subscriptions (grandfathering vs immediate)
- [ ] Create sync status endpoint
- [ ] Add manual sync button in admin UI
- [ ] Add automatic sync on price changes

**Files to Create**:
- `server/src/services/stripePriceSyncService.ts` - NEW: Stripe sync service

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add sync endpoints
- `server/src/services/pricingService.ts` - Trigger sync on updates

#### 0.4 Price Change Email Notifications
**Priority**: High  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create email template for price changes
- [ ] Build email blast system
- [ ] Add recipient filtering (affected users only)
- [ ] Create email preview in admin UI
- [ ] Add scheduling for email sends
- [ ] Track email delivery status

**Files to Create**:
- `server/src/services/priceChangeEmailService.ts` - NEW: Email service
- `server/src/templates/priceChangeEmail.html` - NEW: Email template
- `web/src/components/admin/EmailBlastEditor.tsx` - NEW: Email editor
- `web/src/components/admin/EmailRecipientSelector.tsx` - NEW: Recipient filter
- `web/src/components/admin/EmailPreview.tsx` - NEW: Email preview

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add email endpoints
- `web/src/app/admin-portal/pricing/page.tsx` - Add email blast UI

#### 0.5 Price Change Impact Analysis
**Priority**: High  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create impact analysis service
- [ ] Calculate affected user count by tier
- [ ] Estimate revenue impact
- [ ] Predict churn risk
- [ ] Show historical price change impacts
- [ ] Add recommendations based on analysis

**Files to Create**:
- `server/src/services/priceImpactService.ts` - NEW: Impact analysis
- `web/src/components/admin/PriceImpactDashboard.tsx` - NEW: Impact visualization

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add impact endpoint
- `web/src/app/admin-portal/pricing/page.tsx` - Add impact preview

---

### Phase 1: Pricing Model Updates (Week 2)

#### 1.1 AI Query Caps & Query Packs ✅ COMPLETE
**Priority**: High  
**Estimated Time**: 3-4 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Create AIQueryBalance and AIQueryPurchase database models
- [x] Implement AIQueryService for balance management
- [x] Create query pack pricing configuration
- [x] Update FeatureGatingService to check query balance
- [x] Integrate query consumption in AI services
- [x] Create query pack purchase endpoints
- [x] Build query pack purchase UI
- [x] Create monthly job to reset base allowances
- [x] Integrate Stripe webhook for purchase completion
- [x] Add AIQueryBalance component to BillingModal

**Implementation Summary**:
- **Database**: Created `AIQueryBalance` and `AIQueryPurchase` models in `prisma/modules/billing/aiQueryBalance.prisma`
- **Service**: `server/src/services/aiQueryService.ts` - Complete balance management, consumption, and purchase handling
- **API**: Routes at `/api/ai/queries/*` for balance, consumption, purchase, and history
- **Frontend**: `AIQueryBalance.tsx` and `QueryPackPurchase.tsx` components integrated into BillingModal
- **Integration**: Query consumption integrated into `/api/ai/twin` endpoint with balance checks
- **Webhook**: Stripe webhook handler updated to process query pack purchases
- **Scheduled Job**: Monthly cron job for allowance reset and rollover

**Migration Status**: 
- ⚠️ Migration file ready but requires database reset to apply
- Run: `pnpm prisma migrate dev --name add_ai_query_balance_models` (after backup/reset)

**Files to Create**:
- `server/src/services/aiQueryService.ts` - NEW
- `server/src/config/aiQueryPacks.ts` - NEW
- `server/src/controllers/aiQueryController.ts` - NEW
- `prisma/modules/billing/aiQueryBalance.prisma` - NEW
- `prisma/modules/billing/aiQueryPurchase.prisma` - NEW
- `web/src/components/AIQueryBalance.tsx` - NEW
- `web/src/components/QueryPackPurchase.tsx` - NEW

**Files to Modify**:
- `server/src/services/featureGatingService.ts` - Add query balance checks
- `server/src/middleware/subscriptionMiddleware.ts` - Add query limit middleware
- `server/src/services/stripeService.ts` - Handle query pack payments
- `web/src/components/BillingModal.tsx` - Add query pack section

#### 1.3 AI Query Overage Billing (Cursor-Style Spending Limits) ✅ COMPLETE
**Priority**: High  
**Estimated Time**: 7 hours  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Add spending limit fields to AIQueryBalance schema
- [x] Update AIQueryService.consumeQuery() to check spending limits
- [x] Add setSpendingLimit() and getSpendingStatus() methods
- [x] Update monthly reset logic to reset spending
- [x] Integrate AI query overage into OverageBillingService
- [x] Create API endpoints for spending limit management
- [x] Update AIQueryBalance component to show spending status
- [x] Create AISpendingLimitModal component
- [x] Integrate spending limit modal into BillingModal
- [x] Update BillingModal size to xlarge for better visibility

**Implementation Summary**:
- **Database**: Added 4 spending limit fields to `AIQueryBalance` model:
  - `monthlySpendingLimit` (Float, default: 0) - User-configurable monthly limit
  - `currentPeriodSpending` (Float, default: 0) - Real-time spending tracking
  - `overageQueriesUsed` (Int, default: 0) - Number of overage queries this period
  - `overageQueriesCost` (Float, default: 0) - Total cost of overage queries
- **Service**: Updated `AIQueryService` with spending limit logic:
  - Modified `consumeQuery()` to check spending limits when base allowance exhausted
  - Added `setSpendingLimit()` for limit management
  - Added `getSpendingStatus()` for spending information
  - Updated `resetMonthlyAllowance()` to reset spending at start of new period
- **Billing**: Integrated AI query overage into `OverageBillingService`:
  - Creates Stripe invoice items for overage queries at end of billing period
  - Includes AI query overage in total overage calculation
- **API**: New endpoints for spending limit management:
  - `GET /api/ai/queries/spending` - Get current spending status
  - `PUT /api/ai/queries/spending/limit` - Set monthly spending limit
- **Frontend**: Complete UI for spending limit management:
  - Updated `AIQueryBalance.tsx` to show spending status with progress bar
  - Created `AISpendingLimitModal.tsx` for limit management
  - Integrated into `BillingModal.tsx` with xlarge size for better visibility
- **Configuration**: Added `AI_QUERY_OVERAGE_CONFIG`:
  - `pricePerQuery: 0.02` - $0.02 per query over base allowance
  - `defaultLimit: 0` - Default to $0 (disabled, maintains current blocking behavior)

**How It Works**:
1. User sets spending limit (e.g., $50/month) via modal
2. Base allowance used first (free, included in subscription)
3. When base exhausted, queries continue and charge against spending limit
4. Real-time tracking updates as queries are consumed
5. Queries blocked when spending limit reached
6. Monthly billing: overage charged at end of period via Stripe invoice items
7. Reset next month: spending resets, limit persists

**Default Behavior**:
- Default limit: $0 (maintains current blocking behavior)
- User must opt-in: Users must set a limit to enable overage
- No surprise charges: Clear error messages and warnings

**Files Modified**:
- `prisma/modules/billing/aiQueryBalance.prisma` - Added spending limit fields
- `server/src/config/aiQueryPacks.ts` - Added overage configuration
- `server/src/services/aiQueryService.ts` - Spending limit logic and methods
- `server/src/services/overageBillingService.ts` - AI query overage billing integration
- `server/src/controllers/aiQueryController.ts` - Spending limit endpoints
- `server/src/routes/aiQueries.ts` - Spending limit routes
- `web/src/components/AIQueryBalance.tsx` - Spending status display
- `web/src/components/AISpendingLimitModal.tsx` - NEW: Spending limit management modal
- `web/src/components/BillingModal.tsx` - Modal integration and size update

**What This Enables**:
- Cursor-style spending limit system for AI query overage
- User-controlled spending with no surprise charges
- Seamless experience (no blocking until limit reached)
- Automatic billing for overage usage at end of period
- Clear budget management and spending visibility

#### 1.2 Developer Revenue Split (Apple Model) ✅ COMPLETE
**Priority**: Medium  
**Estimated Time**: 2-3 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Create RevenueSplitService with Apple-style logic
- [x] Add fields to Module model (totalLifetimeRevenue, smallBusinessEligible)
- [x] Update ModuleSubscriptionService to use dynamic revenue split
- [x] Add commission tracking to DeveloperRevenue model
- [x] Create monthly job to calculate developer lifetime revenue
- [x] Update developer portal to show commission rates

**Implementation Summary**:
- **Service**: `server/src/services/revenueSplitService.ts` - Dynamic commission calculation (30% standard, 15% small business/long-term)
- **Database**: Updated `Module` model with `totalLifetimeRevenue` and `smallBusinessEligible` fields
- **Integration**: Updated `ModuleSubscriptionService` and `StripeService` to use dynamic revenue split
- **Developer Portal**: Updated admin portal payout page to display commission rates and types
- **Scheduled Job**: Monthly cron job to update developer eligibility

**Files to Create**:
- `server/src/services/revenueSplitService.ts` - NEW

**Files to Modify**:
- `server/src/services/moduleSubscriptionService.ts` - Use RevenueSplitService
- `server/src/services/stripeService.ts` - Update payment handling
- `server/src/services/paymentService.ts` - Update subscription creation
- `prisma/modules/billing/subscriptions.prisma` - Add Module fields
- `server/src/config/stripe.ts` - Remove hardcoded REVENUE_SPLIT

**See**: `memory-bank/BILLING_PRICING_UPDATES.md` for detailed implementation

---

### Phase 2: Complete Standard Tier (Weeks 3-4)

#### 2.1 Verify & Complete Payment Flow ✅ COMPLETE
**Priority**: High  
**Estimated Time**: 3-4 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Verify Stripe price IDs are configured for all tiers
- [x] Create Stripe checkout session endpoint
- [x] Build checkout UI component with Stripe Elements
- [x] Implement payment success/failure handling
- [x] Test complete subscription flow (signup → payment → activation)

**Implementation Summary**:
- **Stripe Service**: Added `createCheckoutSession` to `StripeService`
- **Billing Controller**: Added `createCheckoutSession` endpoint
- **Routes**: Added `/api/billing/checkout/session` route
- **Frontend Pages**: Created `/billing/success` and `/billing/cancel` pages
- **Integration**: Checkout flow integrated into `BillingModal`

**Files to Create/Modify**:
- `server/src/routes/billing.ts` - Add checkout session endpoint
- `web/src/components/CheckoutModal.tsx` - NEW: Stripe checkout UI
- `web/src/components/BillingModal.tsx` - Add upgrade/downgrade buttons
- `web/src/app/billing/success/page.tsx` - NEW: Payment success page
- `web/src/app/billing/cancel/page.tsx` - NEW: Payment cancel page

**Dependencies**:
- Stripe account with products/prices configured
- Environment variables for Stripe keys

#### 2.2 Payment Method Management ✅ COMPLETE
**Priority**: High  
**Estimated Time**: 2-3 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Create payment method management endpoints
- [x] Build payment method UI (add, update, delete, set default)
- [x] Integrate with Stripe Customer portal
- [x] Add payment method to billing modal

**Files to Create/Modify**:
- `server/src/controllers/billingController.ts` - Add payment method endpoints
- `server/src/routes/billing.ts` - Register payment method routes
- `web/src/components/PaymentMethodManager.tsx` - NEW: Payment method UI
- `web/src/components/BillingModal.tsx` - Add payment methods tab

#### 2.3 Usage Limits & Overage Enforcement ✅ COMPLETE
**Priority**: High  
**Estimated Time**: 3-4 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Verify usage tracking is working for all metrics
- [x] Implement usage limit checking middleware
- [x] Create overage calculation logic
- [x] Build usage alerts UI (warnings at 80%, 90%, 100%)
- [x] Implement overage billing

**Files to Create/Modify**:
- `server/src/middleware/usageLimitMiddleware.ts` - NEW: Usage limit checking
- `server/src/services/usageTrackingService.ts` - NEW: Centralized usage tracking
- `web/src/components/UsageAlerts.tsx` - NEW: Usage warning UI
- `web/src/components/BillingModal.tsx` - Enhance usage tab with charts

**Dependencies**:
- FeatureGatingService integration
- Usage tracking for AI calls, storage, etc.

#### 1.4 Subscription Lifecycle UI ✅ COMPLETE
**Priority**: Medium  
**Estimated Time**: 2-3 days  
**Status**: ✅ **COMPLETE** (January 2025)

**Tasks**:
- [x] Build upgrade/downgrade flow UI
- [x] Implement plan comparison component
- [x] Add cancellation flow with retention offers
- [x] Build reactivation flow
- [x] Add proration display

**Implementation Summary**:
- **PlanComparison Component**: Side-by-side comparison table for all 5 tiers with feature checklist
- **UpgradeFlow Component**: Wizard-style upgrade/downgrade flow with two-step confirmation process
- **CancelSubscriptionModal Component**: Cancellation flow with retention offers (20% off for 3 months)
- **BillingModal Integration**: All components integrated with new "Plans" tab and modal state management
- **Proration Display**: Messaging about Stripe automatic proration calculation
- **Reactivation Flow**: Button to reactivate cancelled subscriptions

**Files Created**:
- `web/src/components/PlanComparison.tsx` - Feature comparison table
- `web/src/components/UpgradeFlow.tsx` - Upgrade/downgrade wizard
- `web/src/components/CancelSubscriptionModal.tsx` - Cancellation flow with retention offers

**Files Modified**:
- `web/src/components/BillingModal.tsx` - Integrated all flows, added "Plans" tab, modal state management

---

### Phase 2: Enterprise Tier Features (Weeks 3-4)

#### 2.1 Enterprise Admin Dashboard
**Priority**: High  
**Estimated Time**: 4-5 days

**Tasks**:
- [ ] Create enterprise billing dashboard
- [ ] Build multi-user billing overview
- [ ] Implement seat management UI
- [ ] Add usage aggregation by user/department
- [ ] Create billing reports

**Files to Create/Modify**:
- `web/src/app/business/[id]/admin/billing/page.tsx` - NEW: Enterprise billing dashboard
- `web/src/components/enterprise/SeatManagement.tsx` - NEW: Seat management UI
- `web/src/components/enterprise/UsageAggregation.tsx` - NEW: Usage breakdown
- `server/src/controllers/billingController.ts` - Add enterprise endpoints

#### 2.2 Custom Pricing & Volume Discounts
**Priority**: Medium  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create custom pricing model in database
- [ ] Build custom pricing UI for enterprise
- [ ] Implement volume discount calculation
- [ ] Add discount management endpoints
- [ ] Create pricing negotiation workflow

**Files to Create/Modify**:
- `prisma/modules/billing/subscriptions.prisma` - Add custom pricing fields
- `server/src/services/customPricingService.ts` - NEW: Custom pricing logic
- `web/src/components/enterprise/CustomPricingEditor.tsx` - NEW: Pricing UI
- `server/src/controllers/billingController.ts` - Add custom pricing endpoints

#### 2.3 Add-on Management
**Priority**: Medium  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create add-on model in database
- [ ] Build add-on catalog
- [ ] Implement add-on subscription flow
- [ ] Create add-on management UI
- [ ] Add add-on billing integration

**Files to Create/Modify**:
- `prisma/modules/billing/subscriptions.prisma` - Add add-on model
- `server/src/services/addOnService.ts` - NEW: Add-on management
- `web/src/components/AddOnCatalog.tsx` - NEW: Add-on browsing
- `web/src/components/AddOnManager.tsx` - NEW: Add-on management

---

### Phase 4: Advanced Features (Weeks 7-8)

#### 3.1 Advanced Usage Analytics
**Priority**: Medium  
**Estimated Time**: 4-5 days

**Tasks**:
- [ ] Build usage analytics service
- [ ] Create usage charts and visualizations
- [ ] Implement usage trends analysis
- [ ] Add cost breakdown by feature/module
- [ ] Create usage forecasting

**Files to Create/Modify**:
- `server/src/services/usageAnalyticsService.ts` - NEW: Analytics calculations
- `web/src/components/UsageCharts.tsx` - NEW: Chart components
- `web/src/components/UsageTrends.tsx` - NEW: Trend analysis
- `web/src/components/BillingModal.tsx` - Enhance usage tab

**Dependencies**:
- Chart library (recharts already used in admin portal)

#### 3.2 Invoice Generation & Download
**Priority**: High  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create invoice PDF generation service
- [ ] Build invoice template
- [ ] Implement invoice download endpoint
- [ ] Add invoice email delivery
- [ ] Create invoice preview UI

**Files to Create/Modify**:
- `server/src/services/invoiceService.ts` - NEW: PDF generation
- `server/src/templates/invoice.html` - NEW: Invoice template
- `server/src/controllers/billingController.ts` - Add download endpoint
- `web/src/components/InvoicePreview.tsx` - NEW: Invoice preview
- `web/src/components/BillingModal.tsx` - Add download buttons

**Dependencies**:
- PDF generation library (pdfkit, puppeteer, or similar)

#### 3.3 Automated Billing Workflows
**Priority**: Medium  
**Estimated Time**: 4-5 days

**Tasks**:
- [ ] Create automated invoice generation job
- [ ] Implement dunning management (payment recovery)
- [ ] Build email notification system for billing events
- [ ] Create billing reminder system
- [ ] Implement auto-retry for failed payments

**Files to Create/Modify**:
- `server/src/jobs/billingJobs.ts` - NEW: Scheduled billing jobs
- `server/src/services/dunningService.ts` - NEW: Payment recovery
- `server/src/services/billingNotificationService.ts` - NEW: Email notifications
- `server/src/templates/billingEmails/` - NEW: Email templates

**Dependencies**:
- Job scheduler (node-cron or similar)
- Email service integration

#### 3.4 Predictive Billing & Cost Optimization
**Priority**: Low  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Build usage prediction models
- [ ] Create cost optimization recommendations
- [ ] Implement billing alerts (projected overage)
- [ ] Add cost savings suggestions

**Files to Create/Modify**:
- `server/src/services/billingPredictionService.ts` - NEW: Prediction logic
- `web/src/components/CostOptimization.tsx` - NEW: Recommendations UI
- `web/src/components/BillingModal.tsx` - Add predictions section

---

### Phase 4: Webhook & Integration (Week 7)

#### 4.1 Webhook Endpoint & Security
**Priority**: High  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create webhook endpoint route
- [ ] Implement Stripe signature verification
- [ ] Add webhook event logging
- [ ] Create webhook testing utilities
- [ ] Add webhook retry logic

**Files to Create/Modify**:
- `server/src/routes/billing.ts` - Add webhook endpoint
- `server/src/middleware/stripeWebhookMiddleware.ts` - NEW: Signature verification
- `server/src/services/webhookLogService.ts` - NEW: Webhook logging

#### 4.2 Webhook Event Handling
**Priority**: High  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Verify all webhook handlers are working
- [ ] Add missing webhook event types
- [ ] Implement idempotency for webhooks
- [ ] Add webhook error handling and retries
- [ ] Create webhook monitoring dashboard

**Files to Create/Modify**:
- `server/src/services/subscriptionService.ts` - Enhance webhook handlers
- `server/src/services/stripeService.ts` - Complete webhook handling
- `web/src/app/admin-portal/webhooks/page.tsx` - NEW: Webhook monitoring

---

### Phase 5: Pricing Management System (Week 8) - NEW

#### 5.1 Database-Driven Pricing
**Priority**: High  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create PricingConfig database model
- [ ] Migrate hardcoded pricing to database
- [ ] Create pricing service that reads from database
- [ ] Add pricing version history/audit trail
- [ ] Create pricing cache for performance
- [ ] Update all services to use database pricing

**Database Schema**:
```prisma
model PricingConfig {
  id              String   @id @default(uuid())
  tier            String   // 'free', 'pro', 'business_basic', etc.
  billingCycle    String   // 'monthly', 'yearly'
  
  // Pricing
  basePrice       Float
  perEmployeePrice Float?  // For business tiers
  includedEmployees Int?   // For business tiers
  
  // AI Query Packs
  queryPackSmall  Float?   // 500 queries
  queryPackMedium Float?   // 2,500 queries
  queryPackLarge  Float?   // 5,000 queries
  queryPackEnterprise Float? // 10,000 queries
  
  // Base AI Allowances
  baseAIAllowance Int?    // Queries included per month
  
  // Status
  isActive        Boolean  @default(true)
  effectiveDate   DateTime // When this pricing takes effect
  endDate         DateTime? // When this pricing expires (for future changes)
  
  // Metadata
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relationships
  createdByUser   User     @relation(fields: [createdBy], references: [id])
  priceChanges    PriceChange[]
  
  @@unique([tier, billingCycle, effectiveDate])
  @@index([tier, isActive])
  @@index([effectiveDate])
}

model PriceChange {
  id              String   @id @default(uuid())
  pricingConfigId String
  oldPrice        Float
  newPrice        Float
  changeType      String   // 'base_price', 'per_employee', 'query_pack', etc.
  reason          String?
  notificationSent Boolean @default(false)
  notificationSentAt DateTime?
  
  createdBy       String
  createdAt       DateTime @default(now())
  
  pricingConfig   PricingConfig @relation(fields: [pricingConfigId], references: [id])
  createdByUser   User     @relation(fields: [createdBy], references: [id])
  
  @@index([pricingConfigId])
  @@index([createdAt])
}
```

**Files to Create**:
- `server/src/services/pricingService.ts` - NEW: Centralized pricing service
- `server/src/controllers/pricingController.ts` - NEW: Pricing management endpoints
- `server/src/routes/pricing.ts` - NEW: Pricing routes
- `prisma/modules/billing/pricingConfig.prisma` - NEW: Pricing models

**Files to Modify**:
- `server/src/config/stripe.ts` - Read from database instead of hardcoded
- `server/src/services/subscriptionService.ts` - Use PricingService
- `server/src/services/moduleSubscriptionService.ts` - Use PricingService
- `server/src/services/aiQueryService.ts` - Use PricingService for query packs

**Database Migration**:
```bash
# Create migration for pricing models
pnpm prisma migrate dev --name add_pricing_management
```

#### 5.2 Admin Portal Pricing Management UI
**Priority**: High  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create pricing management page in admin portal
- [ ] Build pricing table with all tiers and cycles
- [ ] Add inline editing for prices
- [ ] Show pricing history and changes
- [ ] Add effective date scheduling (future price changes)
- [ ] Display impact analysis (affected users, revenue impact)
- [ ] Add validation and confirmation dialogs

**UI Features**:
- **Pricing Overview Table**: All tiers, monthly/yearly, current vs future pricing
- **Quick Edit**: Inline editing with validation
- **Bulk Update**: Update multiple prices at once
- **Price History**: Timeline of all price changes
- **Impact Preview**: Shows how many users will be affected
- **Stripe Sync Status**: Shows if Stripe prices are in sync

**Files to Create**:
- `web/src/app/admin-portal/pricing/page.tsx` - NEW: Pricing management page
- `web/src/components/admin/PricingTable.tsx` - NEW: Pricing table component
- `web/src/components/admin/PricingEditor.tsx` - NEW: Price editing modal
- `web/src/components/admin/PriceHistory.tsx` - NEW: Price change history
- `web/src/components/admin/PriceImpactAnalysis.tsx` - NEW: Impact preview
- `web/src/lib/pricingApiService.ts` - NEW: Pricing API client

**Files to Modify**:
- `web/src/app/admin-portal/layout.tsx` - Add pricing menu item
- `web/src/lib/adminApiService.ts` - Add pricing methods

#### 5.3 Stripe Price Synchronization
**Priority**: High  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create service to sync database prices to Stripe
- [ ] Update Stripe prices when database prices change
- [ ] Handle price updates for existing subscriptions (grandfathering vs immediate)
- [ ] Create sync status endpoint
- [ ] Add manual sync button in admin UI
- [ ] Add automatic sync on price changes

**Implementation**:
```typescript
// server/src/services/stripePriceSyncService.ts (NEW)
export class StripePriceSyncService {
  /**
   * Sync all pricing from database to Stripe
   */
  static async syncAllPrices(): Promise<SyncResult> {
    const activePricing = await prisma.pricingConfig.findMany({
      where: { isActive: true },
      orderBy: { effectiveDate: 'desc' },
    });

    const results = [];
    for (const pricing of activePricing) {
      const result = await this.syncPriceToStripe(pricing);
      results.push(result);
    }

    return { synced: results.length, results };
  }

  /**
   * Sync single price to Stripe
   */
  static async syncPriceToStripe(pricing: PricingConfig): Promise<PriceSyncResult> {
    // Get or create Stripe product
    const productId = await this.getOrCreateStripeProduct(pricing.tier);
    
    // Update or create Stripe price
    const priceId = await this.updateStripePrice(productId, pricing);
    
    // Update pricing config with Stripe price ID
    await prisma.pricingConfig.update({
      where: { id: pricing.id },
      data: { stripePriceId: priceId },
    });

    return { success: true, priceId, tier: pricing.tier };
  }

  /**
   * Handle price changes for existing subscriptions
   */
  static async handlePriceChange(
    oldPrice: PricingConfig,
    newPrice: PricingConfig,
    updateStrategy: 'grandfather' | 'immediate' | 'scheduled'
  ): Promise<void> {
    if (updateStrategy === 'grandfather') {
      // Existing subscriptions keep old price
      // Only new subscriptions get new price
      return;
    }

    if (updateStrategy === 'immediate') {
      // Update all active subscriptions to new price
      await this.updateAllSubscriptions(oldPrice, newPrice);
    }

    if (updateStrategy === 'scheduled') {
      // Schedule update for future date
      await this.schedulePriceUpdate(oldPrice, newPrice, newPrice.effectiveDate);
    }
  }
}
```

**Files to Create**:
- `server/src/services/stripePriceSyncService.ts` - NEW: Stripe sync service

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add sync endpoints
- `server/src/services/pricingService.ts` - Trigger sync on updates

#### 5.4 Price Change Email Notifications
**Priority**: Medium  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create email template for price changes
- [ ] Build email blast system
- [ ] Add recipient filtering (affected users only)
- [ ] Create email preview in admin UI
- [ ] Add scheduling for email sends
- [ ] Track email delivery status
- [ ] Add A/B testing for email content

**Email Features**:
- **Template Editor**: Rich text editor for email content
- **Recipient Selection**: Filter by tier, subscription status, etc.
- **Preview**: Preview email before sending
- **Scheduling**: Schedule email for future date
- **A/B Testing**: Test different email variations
- **Delivery Tracking**: Track opens, clicks, unsubscribes

**Email Template Variables**:
- `{{userName}}` - User's name
- `{{currentPrice}}` - Current subscription price
- `{{newPrice}}` - New subscription price
- `{{priceChange}}` - Dollar amount change
- `{{priceChangePercent}}` - Percentage change
- `{{effectiveDate}}` - When price change takes effect
- `{{tierName}}` - Subscription tier name
- `{{billingCycle}}` - Monthly or yearly

**Files to Create**:
- `server/src/services/priceChangeEmailService.ts` - NEW: Email service
- `server/src/templates/priceChangeEmail.html` - NEW: Email template
- `server/src/controllers/emailController.ts` - NEW: Email management endpoints
- `web/src/components/admin/EmailBlastEditor.tsx` - NEW: Email editor
- `web/src/components/admin/EmailRecipientSelector.tsx` - NEW: Recipient filter
- `web/src/components/admin/EmailPreview.tsx` - NEW: Email preview
- `web/src/components/admin/EmailScheduler.tsx` - NEW: Email scheduling

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add email endpoints
- `web/src/app/admin-portal/pricing/page.tsx` - Add email blast UI

#### 5.5 Price Change Impact Analysis
**Priority**: Medium  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Create impact analysis service
- [ ] Calculate affected user count by tier
- [ ] Estimate revenue impact
- [ ] Predict churn risk
- [ ] Show historical price change impacts
- [ ] Add recommendations based on analysis

**Impact Metrics**:
- **Affected Users**: Count of users on each tier
- **Revenue Impact**: Projected revenue change
- **Churn Risk**: Estimated churn based on price increase %
- **Grandfathering Impact**: Revenue if grandfathering is used
- **Timeline Impact**: Revenue over next 12 months

**Files to Create**:
- `server/src/services/priceImpactService.ts` - NEW: Impact analysis
- `web/src/components/admin/PriceImpactDashboard.tsx` - NEW: Impact visualization

**Files to Modify**:
- `server/src/controllers/pricingController.ts` - Add impact endpoint
- `web/src/app/admin-portal/pricing/page.tsx` - Add impact preview

---

### Phase 6: UI/UX Enhancements (Week 10)

#### 5.1 Billing Dashboard Redesign
**Priority**: Medium  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Redesign billing modal with better UX
- [ ] Add billing dashboard page (not just modal)
- [ ] Implement billing widgets for main dashboard
- [ ] Create billing settings page
- [ ] Add billing notifications center

**Files to Create/Modify**:
- `web/src/app/billing/page.tsx` - NEW: Dedicated billing page
- `web/src/components/BillingModal.tsx` - Redesign
- `web/src/components/BillingWidget.tsx` - NEW: Dashboard widget
- `web/src/app/settings/billing/page.tsx` - NEW: Billing settings

#### 5.2 Payment History & Transactions
**Priority**: Medium  
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Build detailed payment history UI
- [ ] Add transaction details view
- [ ] Implement payment search and filtering
- [ ] Create payment export functionality

**Files to Create/Modify**:
- `web/src/components/PaymentHistory.tsx` - NEW: Payment history UI
- `web/src/components/TransactionDetails.tsx` - NEW: Transaction view
- `web/src/components/BillingModal.tsx` - Add payment history tab

#### 5.3 Usage Visualization
**Priority**: Medium  
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create usage charts (line, bar, pie)
- [ ] Add usage breakdown by module/feature
- [ ] Implement usage comparison (current vs previous period)
- [ ] Add usage forecasting visualization

**Files to Create/Modify**:
- `web/src/components/UsageCharts.tsx` - NEW: Chart components
- `web/src/components/UsageBreakdown.tsx` - NEW: Breakdown view
- `web/src/components/BillingModal.tsx` - Enhance usage tab

---

## 📋 Pricing Management System Details

### Admin Portal Pricing Page Structure

```
/admin-portal/pricing
├── Overview Tab
│   ├── Current Pricing Table (all tiers)
│   ├── Quick Stats (total revenue, affected users)
│   └── Sync Status (Stripe sync status)
│
├── Edit Pricing Tab
│   ├── Pricing Editor (inline editing)
│   ├── Bulk Update (update multiple at once)
│   ├── Effective Date Scheduler
│   └── Validation & Confirmation
│
├── Price History Tab
│   ├── Timeline of all changes
│   ├── Change details (who, when, why)
│   └── Impact analysis per change
│
├── Email Blast Tab
│   ├── Email Template Editor
│   ├── Recipient Selector
│   ├── Email Preview
│   ├── Schedule Send
│   └── Delivery Tracking
│
└── Impact Analysis Tab
    ├── Affected Users Count
    ├── Revenue Impact Projection
    ├── Churn Risk Assessment
    └── Recommendations
```

### Pricing Update Workflow

1. **Admin edits price** in admin portal
2. **System validates** price change (min/max, format, etc.)
3. **Impact analysis** runs automatically
4. **Admin reviews** impact and confirms
5. **Stripe sync** updates Stripe prices
6. **Price change record** created in database
7. **Email notification** sent (if configured)
8. **Audit log** entry created

### Grandfathering Strategy

When prices increase, admins can choose:
- **Grandfather Existing**: Existing subscribers keep old price
- **Immediate Update**: All subscribers get new price on next billing cycle
- **Scheduled Update**: New price takes effect on specific date
- **Phased Rollout**: Gradual price increase over time

### Email Blast Features

- **Template Library**: Pre-built email templates
- **Personalization**: Dynamic variables per user
- **Segmentation**: Filter by tier, subscription age, usage, etc.
- **A/B Testing**: Test subject lines and content
- **Scheduling**: Send immediately or schedule for future
- **Tracking**: Open rates, click rates, unsubscribes
- **Compliance**: Unsubscribe links, CAN-SPAM compliance

---

## 📋 Detailed Task Breakdown

### Week 1: Payment Flow & Methods

**Day 1-2: Stripe Checkout Integration**
- [ ] Verify Stripe configuration
- [ ] Create checkout session endpoint
- [ ] Build checkout UI with Stripe Elements
- [ ] Test payment flow

**Day 3-4: Payment Method Management**
- [ ] Create payment method endpoints
- [ ] Build payment method UI
- [ ] Integrate Stripe Customer portal
- [ ] Test payment method CRUD

**Day 5: Usage Limits Foundation**
- [ ] Review usage tracking implementation
- [ ] Create usage limit middleware
- [ ] Test limit enforcement

### Week 2: Usage & Lifecycle

**Day 1-2: Usage Limits & Overage**
- [ ] Implement overage calculation
- [ ] Build usage alerts UI
- [ ] Add overage billing
- [ ] Test usage limit flows

**Day 3-4: Subscription Lifecycle**
- [ ] Build upgrade/downgrade flow
- [ ] Create plan comparison UI
- [ ] Implement cancellation flow
- [ ] Add reactivation flow

**Day 5: Testing & Polish**
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] UI polish

### Week 3: Enterprise Features

**Day 1-3: Enterprise Dashboard**
- [ ] Create enterprise billing page
- [ ] Build seat management UI
- [ ] Implement usage aggregation
- [ ] Add billing reports

**Day 4-5: Custom Pricing**
- [ ] Design custom pricing model
- [ ] Build custom pricing UI
- [ ] Implement volume discounts
- [ ] Test enterprise flows

### Week 4: Enterprise Completion

**Day 1-2: Add-on Management**
- [ ] Create add-on model
- [ ] Build add-on catalog
- [ ] Implement add-on subscriptions
- [ ] Test add-on billing

**Day 3-5: Enterprise Testing**
- [ ] Enterprise feature testing
- [ ] Multi-user billing testing
- [ ] Custom pricing testing
- [ ] Bug fixes

### Week 5: Advanced Analytics

**Day 1-3: Usage Analytics**
- [ ] Build analytics service
- [ ] Create usage charts
- [ ] Implement trend analysis
- [ ] Add cost breakdown

**Day 4-5: Invoice Generation**
- [ ] Create PDF generation service
- [ ] Build invoice template
- [ ] Implement download functionality
- [ ] Add email delivery

### Week 6: Automation

**Day 1-2: Automated Invoicing**
- [ ] Create invoice generation job
- [ ] Schedule monthly invoicing
- [ ] Test automated flow

**Day 3-4: Dunning Management**
- [ ] Build payment recovery service
- [ ] Implement retry logic
- [ ] Create dunning emails
- [ ] Test recovery flow

**Day 5: Billing Notifications**
- [ ] Create notification service
- [ ] Build email templates
- [ ] Implement billing reminders
- [ ] Test notifications

### Week 7: Webhooks & Integration

**Day 1-2: Webhook Infrastructure**
- [ ] Create webhook endpoint
- [ ] Implement signature verification
- [ ] Add webhook logging
- [ ] Test webhook security

**Day 3-4: Webhook Handlers**
- [ ] Verify all handlers
- [ ] Add missing events
- [ ] Implement idempotency
- [ ] Add error handling

**Day 5: Webhook Monitoring**
- [ ] Create monitoring dashboard
- [ ] Add webhook testing tools
- [ ] Document webhook events

### Week 8: UI/UX Polish

**Day 1-2: Billing Dashboard**
- [ ] Redesign billing modal
- [ ] Create billing page
- [ ] Add billing widgets
- [ ] Build settings page

**Day 3-4: Payment History**
- [ ] Build payment history UI
- [ ] Add transaction details
- [ ] Implement search/filter
- [ ] Add export functionality

**Day 5: Final Polish**
- [ ] Usage visualization enhancements
- [ ] UI/UX improvements
- [ ] Final testing
- [ ] Documentation

---

## 🔧 Technical Implementation Details

### Stripe Integration

#### Required Stripe Products & Prices
```typescript
// Core Tiers
- Free Tier: $0/month (no Stripe product needed)
- Pro Tier: $49.99/month (Stripe product + price)
- Business Basic: $49.99/month
- Business Advanced: $69.99/month
- Enterprise: Custom pricing (no standard price)

// Module Subscriptions
- Each module can have premium/enterprise tiers
- Prices stored in Module model (basePrice, enterprisePrice)
```

#### Webhook Events to Handle
```typescript
// Critical Events
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- payment_intent.succeeded
- payment_intent.payment_failed

// Optional Events
- customer.subscription.trial_will_end
- invoice.upcoming
- customer.updated
```

#### Webhook Endpoint Structure
```typescript
// server/src/routes/billing.ts
router.post('/webhooks/stripe', 
  stripeWebhookMiddleware,  // Signature verification
  async (req, res) => {
    const event = req.body;
    
    // Route to appropriate service
    await SubscriptionService.handleStripeWebhook(event);
    await ModuleSubscriptionService.handleStripeWebhook(event);
    await StripeService.handleWebhookEvent(event);
    
    res.json({ received: true });
  }
);
```

### Usage Tracking

#### Metrics to Track
```typescript
// Core Metrics
- ai_api_calls: Number of AI API requests
- storage_gb: Storage usage in GB
- api_requests: General API request count
- active_users: Number of active users (enterprise)

// Module-Specific Metrics
- module_[moduleId]_usage: Module-specific usage
- feature_[featureName]_usage: Feature-specific usage
```

#### Usage Limit Enforcement
```typescript
// Middleware Pattern
export const checkUsageLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const feature = req.body.feature;
  
  const hasAccess = await FeatureGatingService.checkFeatureAccess(
    user.id,
    feature,
    req.body.businessId
  );
  
  if (!hasAccess.hasAccess) {
    return res.status(403).json({
      error: 'Usage limit exceeded',
      limit: hasAccess.limit,
      current: hasAccess.currentUsage
    });
  }
  
  next();
};
```

### Feature Gating Integration

#### Current Feature Gating
- ✅ FeatureGatingService exists with tier definitions
- ✅ Features mapped to required tiers
- ⚠️ Need to verify all AI features are properly gated
- ⚠️ Need to add usage limit enforcement

#### Integration Points
```typescript
// In AI services
const hasAccess = await FeatureGatingService.checkFeatureAccess(
  userId,
  'unlimited_ai',
  businessId
);

if (!hasAccess.hasAccess) {
  throw new Error('AI feature requires Pro tier or higher');
}

// In module routes
const canAccess = await FeatureGatingService.checkModuleAccess(
  userId,
  'hr',
  businessId
);
```

---

## 🎨 UI/UX Design Requirements

### Billing Modal Enhancements

#### Current State
- Basic tabs (Overview, Modules, Usage, Invoices)
- Simple data display
- No interactive features

#### Target State
- **Overview Tab**:
  - Current plan card with upgrade button
  - Usage summary with progress bars
  - Next billing date and amount
  - Quick actions (upgrade, manage payment, view invoices)
  
- **Modules Tab**:
  - Active module subscriptions grid
  - Available modules to subscribe
  - Module pricing and features
  - Subscribe/Unsubscribe buttons
  
- **Usage Tab**:
  - Interactive charts (line, bar, pie)
  - Usage breakdown by module/feature
  - Current period vs previous period comparison
  - Usage alerts and warnings
  - Overage information
  
- **Invoices Tab**:
  - Invoice list with filters
  - Invoice preview modal
  - Download PDF button
  - Payment status indicators
  - Payment history

### New Components Needed

1. **CheckoutModal.tsx** - Stripe checkout flow
2. **PaymentMethodManager.tsx** - Payment method CRUD
3. **PlanComparison.tsx** - Feature comparison table
4. **UpgradeFlow.tsx** - Upgrade/downgrade wizard
5. **CancelSubscriptionModal.tsx** - Cancellation with retention
6. **UsageCharts.tsx** - Usage visualizations
7. **UsageAlerts.tsx** - Usage warnings
8. **InvoicePreview.tsx** - Invoice preview
9. **PaymentHistory.tsx** - Transaction history
10. **SeatManagement.tsx** - Enterprise seat management

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] SubscriptionService methods
- [ ] ModuleSubscriptionService methods
- [ ] StripeService methods
- [ ] FeatureGatingService methods
- [ ] Usage tracking calculations
- [ ] Overage calculations

### Integration Tests
- [ ] Subscription creation flow
- [ ] Payment processing flow
- [ ] Webhook handling
- [ ] Usage limit enforcement
- [ ] Invoice generation

### E2E Tests
- [ ] Complete checkout flow
- [ ] Upgrade/downgrade flow
- [ ] Payment method management
- [ ] Invoice download
- [ ] Enterprise billing flows

---

## 📊 Success Metrics

### Technical Metrics
- Payment success rate > 99%
- Webhook processing time < 500ms
- Invoice generation time < 2s
- Usage tracking accuracy > 99.9%

### Business Metrics
- Conversion rate (free → paid)
- Upgrade rate (basic → advanced)
- Churn rate
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)

### User Experience Metrics
- Billing page load time < 2s
- Checkout completion rate
- Payment method setup success rate
- Invoice download success rate

---

## 🚨 Risk Mitigation

### Technical Risks
1. **Stripe API Failures**
   - Implement retry logic with exponential backoff
   - Add fallback payment methods
   - Queue failed payments for retry

2. **Webhook Delivery Failures**
   - Implement webhook retry queue
   - Add webhook monitoring and alerts
   - Manual webhook replay capability

3. **Usage Tracking Accuracy**
   - Real-time usage validation
   - Usage reconciliation jobs
   - Alert on discrepancies

### Business Risks
1. **Payment Failures**
   - Automated dunning management
   - Payment retry logic
   - Grace period for failed payments

2. **Customer Churn**
   - Retention offers in cancellation flow
   - Usage-based upgrade prompts
   - Proactive customer success outreach

---

## 📝 Dependencies & Prerequisites

### External Services
- ✅ Stripe account (configured)
- ⚠️ Stripe products and prices (need verification)
- ⚠️ Email service for billing notifications
- ⚠️ PDF generation library

### Internal Dependencies
- ✅ Database schema (complete)
- ✅ Backend services (complete)
- ✅ Feature gating system (complete)
- ⚠️ Usage tracking implementation (need verification)
- ⚠️ Email notification service (need verification)

### Environment Variables
```bash
# Required
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS_BASIC=price_...
STRIPE_PRICE_ID_BUSINESS_ADVANCED=price_...
```

---

## 🎯 Priority Order

### Must Have (MVP)
1. ✅ Payment flow (Stripe checkout) - Phase 2.1 COMPLETE
2. ✅ Payment method management - Phase 2.2 COMPLETE
3. ✅ Usage limits enforcement - Phase 2.3 COMPLETE
4. ✅ Basic invoice display - Foundation COMPLETE
5. ✅ Subscription lifecycle (upgrade/downgrade/cancel/reactivate) - Phase 2.4 COMPLETE
6. ✅ Stripe price points & per-employee pricing integration - Phase 2.5 COMPLETE

### Should Have (Phase 1)
1. Invoice PDF generation and download
2. Usage charts and visualizations
3. Automated invoice generation
4. Webhook monitoring
5. Billing notifications

### Nice to Have (Phase 2)
1. Enterprise custom pricing
2. Advanced usage analytics
3. Predictive billing
4. Cost optimization recommendations
5. White-label options

---

## 📅 Timeline Estimate

### Minimum Viable Product (MVP)
**Duration**: 2-3 weeks  
**Scope**: Payment flow, basic billing UI, usage limits

### Phase 1 (Complete Standard Tier)
**Duration**: 4-5 weeks  
**Scope**: All MVP + invoice generation, usage charts, automation

### Phase 2 (Enterprise Features)
**Duration**: 3-4 weeks  
**Scope**: Enterprise dashboard, custom pricing, add-ons

### Phase 3 (Advanced Features)
**Duration**: 2-3 weeks  
**Scope**: Predictive billing, cost optimization, white-label

**Total Estimated Time**: 11-15 weeks for complete implementation

---

## 🔄 Next Steps

1. **Verify Current State** (Day 1)
   - Test existing billing endpoints
   - Verify Stripe configuration
   - Check usage tracking implementation
   - Review feature gating integration

2. **Set Up Stripe** (Day 1-2)
   - Create Stripe products and prices
   - Configure webhook endpoint
   - Set up test environment
   - Document Stripe configuration

3. **Start Phase 1** (Week 1)
   - Begin with payment flow
   - Implement payment method management
   - Build usage limits enforcement

4. **Iterate & Test** (Ongoing)
   - Test each feature as it's built
   - Gather feedback early
   - Adjust plan based on learnings

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Next Review**: After Phase 1 completion

