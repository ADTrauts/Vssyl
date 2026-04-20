# AI Provider Integration Plan - Data & Expenses

## Overview
Integrate OpenAI and Anthropic provider data and expenses into existing admin portal structure without duplication.

## Key Distinctions

### Data vs Expenses

**Provider Usage Data** (What we're tracking):
- Token usage (input/output)
- API requests/calls
- Models used
- Response times
- Error rates
- **Purpose**: Operational monitoring, performance tracking, optimization

**Provider Expenses** (What we're paying):
- Vssyl → OpenAI costs (monthly invoice)
- Vssyl → Anthropic costs (monthly invoice)
- **Purpose**: Financial tracking, cost management, P&L statements

**User Revenue** (What users pay us):
- Already tracked in `/admin-portal/billing` (Financial Management)
- Subscriptions, payments, developer payouts
- **Not affected by this plan**

## Where It Goes in Admin Portal

### 1. AI System Page (`/admin-portal/ai-system`)
**Existing**: General AI system overview, links to AI Learning, Business AI, etc.

**NEW**: Add a **"Provider Usage"** section with tabs:
- **Combined View** - Aggregated usage data from both providers + our metrics
- **OpenAI Official** - Direct from OpenAI API (usage/billing data)
- **Anthropic Official** - Direct from Anthropic API (usage/billing data)

**What Shows Here**:
- Token usage trends
- Request volumes
- Model distribution
- Performance metrics
- Error rates
- Usage by user/business (if available)

**What DOESN'T Show Here**:
- Actual costs/expenses (those go to Financial Management)

### 2. Financial Management Page (`/admin-portal/billing`)
**Existing**: User subscriptions, payments, developer payouts

**NEW**: Add an **"Operating Expenses"** tab:
- OpenAI costs (from their billing API)
- Anthropic costs (from their billing API)
- Total provider expenses
- Cost trends over time
- Comparison to revenue (profitability)

**What Shows Here**:
- Monthly expenses to providers
- Cost breakdown by provider
- Historical expense data
- P&L impact (Revenue - Expenses)

**What DOESN'T Show Here**:
- Usage details (tokens, requests) - those go to AI System

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Provider APIs                         │
├─────────────────────────────────────────────────────────┤
│  OpenAI Admin API → Usage Data + Billing Data           │
│  Anthropic Usage API → Usage Data + Billing Data        │
└─────────────────────────────────────────────────────────┘
           ↓                              ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   AI System Page         │  │  Financial Management    │
│   (Provider Usage)       │  │  (Operating Expenses)    │
├──────────────────────────┤  ├──────────────────────────┤
│  • Combined View         │  │  • OpenAI Expenses       │
│  • OpenAI Official       │  │  • Anthropic Expenses    │
│  • Anthropic Official    │  │  • Cost Trends           │
│                          │  │  • P&L Impact            │
│  Shows:                  │  │                          │
│  - Token usage           │  │  Shows:                  │
│  - Request volumes       │  │  - Monthly costs         │
│  - Performance           │  │  - Cost breakdown        │
│  - Error rates           │  │  - Profitability         │
└──────────────────────────┘  └──────────────────────────┘
```

## Integration with Existing Features

### Existing AI System Features (Keep As-Is)
- ✅ **AI System Overview** (`/admin-portal/ai-system`) - Links to subsystems
- ✅ **AI Learning** (`/admin-portal/ai-learning`) - Centralized learning analytics
- ✅ **Business AI** - Business-specific AI analytics
- ✅ **AI Context** - Module context providers

### What's New (No Duplication)
1. **Provider Usage Dashboard** - NEW section in AI System page
   - Uses official provider APIs as source of truth
   - No duplication - pulls directly from providers
   - Our internal metrics supplement (not replace) provider data

2. **Operating Expenses Tracking** - NEW tab in Financial Management
   - Provider costs as expenses
   - Separate from user revenue
   - P&L calculation

### What We're NOT Replacing
- ❌ NOT replacing existing AI analytics (patterns, insights, learning events)
- ❌ NOT replacing user revenue tracking
- ❌ NOT duplicating provider data (we use their APIs directly)

## Implementation Structure

### Backend Services

#### 1. Provider Data Services
**Location**: `server/src/services/aiProviderServices/`

```
openAIAdminService.ts      → Pulls usage + billing from OpenAI API
anthropicAdminService.ts   → Pulls usage + billing from Anthropic API
combinedProviderService.ts → Aggregates data for combined view
```

#### 2. API Routes

**Provider Usage Routes** (for AI System page):
```
GET /api/admin/ai-providers/usage/combined
GET /api/admin/ai-providers/usage/openai
GET /api/admin/ai-providers/usage/anthropic
```

**Provider Expenses Routes** (for Financial Management):
```
GET /api/admin/expenses/providers
GET /api/admin/expenses/openai
GET /api/admin/expenses/anthropic
GET /api/admin/expenses/summary  → P&L calculation
```

### Frontend Components

#### 1. AI System Page - Provider Usage Section
**File**: `web/src/app/admin-portal/ai-system/page.tsx`

Add new section with tabs:
- Combined View
- OpenAI Official
- Anthropic Official

**Components**:
- `ProviderUsageCombined.tsx`
- `ProviderUsageOpenAI.tsx`
- `ProviderUsageAnthropic.tsx`

#### 2. Financial Management - Operating Expenses Tab
**File**: `web/src/app/admin-portal/billing/page.tsx`

Add new tab: "Operating Expenses"

**Components**:
- `ProviderExpensesView.tsx`
- `ExpenseTrends.tsx`
- `PLImpact.tsx`

## Data Separation Rules

### ✅ Data Goes to AI System Page
- Token counts
- Request volumes
- Model usage
- Performance metrics (response times)
- Error rates
- Usage patterns
- Provider-specific analytics

### ✅ Expenses Go to Financial Management
- Monthly costs to OpenAI
- Monthly costs to Anthropic
- Cost trends
- P&L calculations
- Expense vs revenue comparisons

### ✅ Our Metrics Stay Where They Are
- User satisfaction → AI System analytics (existing)
- Confidence scores → AI System analytics (existing)
- Learning events → AI Learning page (existing)
- Patterns & insights → AI Learning page (existing)

## Benefits of This Structure

1. **Clear Separation**: Data vs expenses are distinct
2. **No Duplication**: Official APIs as source of truth
3. **Logical Organization**: 
   - Usage data with other AI analytics
   - Expenses with other financial data
4. **Existing Features Preserved**: All current functionality remains
5. **Easy Navigation**: Users know where to find what

## Migration Path

### Phase 1: Backend Services
1. Create provider admin services
2. Set up API routes for usage data
3. Set up API routes for expenses

### Phase 2: AI System Page Integration
1. Add "Provider Usage" section
2. Implement three-tab interface
3. Connect to provider APIs

### Phase 3: Financial Management Integration
1. Add "Operating Expenses" tab
2. Show provider costs
3. Calculate P&L impact

### Phase 4: Data Sync
1. Set up scheduled jobs to sync provider data
2. Cache for performance
3. Historical data storage

## Questions Answered

**Q: Where does provider usage data go?**
→ AI System page, new "Provider Usage" section

**Q: Where do provider expenses go?**
→ Financial Management page, new "Operating Expenses" tab

**Q: What about existing AI analytics?**
→ Keep all existing features, supplement with provider data

**Q: How do we avoid duplication?**
→ Use official provider APIs as source of truth, don't duplicate calculation

**Q: What about user revenue?**
→ Already in Financial Management, separate from provider expenses

## Setup Status

### ✅ Completed
- OpenAI Admin API Key stored in Secret Manager (`openai-admin-api-key`)
- Anthropic access configured (user confirmed)
- Scripts created for managing secrets

### 📋 Next Steps
1. Update `cloudbuild.yaml` to include `OPENAI_ADMIN_API_KEY` secret in Cloud Run
2. Implement backend services to pull data from provider APIs
3. Create API routes for usage and expense data
4. Build frontend components for admin portal
