# AI Provider Usage Dashboard Implementation Plan

## Overview
Implement a three-tab dashboard in the admin portal that pulls official usage/cost data from OpenAI and Anthropic APIs, avoiding data duplication and providing a unified view.

## Architecture

### Three-Tab Structure
1. **Combined View (Vssyl)** - Aggregated data from both providers + our internal metrics
2. **OpenAI Official** - Direct data from OpenAI Admin & Audit Logs API
3. **Anthropic Official** - Direct data from Anthropic Usage & Cost API

### Data Sources

#### OpenAI
- **Admin & Audit Logs API**: Admin actions, key lifecycle, user management
- **Usage/Billing API**: Official cost and usage data
- **Admin API Keys**: Required for accessing admin endpoints

#### Anthropic
- **Usage & Cost API** (`/v1/organizations/usage_report/messages`): Token-level usage
- **Cost Report API** (`/v1/organizations/cost_report`): Service-level costs
- **Audit Logs**: Available for Enterprise orgs (export via console)

#### Our Internal Data
- User satisfaction scores
- Confidence metrics
- Application-specific interactions
- Response times
- Feature usage (cross-module queries, etc.)

## Implementation Steps

### Phase 1: Backend Services

#### 1.1 OpenAI Admin Service
**File**: `server/src/services/aiProviderServices/openAIAdminService.ts`

```typescript
export class OpenAIAdminService {
  // Pull usage data from OpenAI Admin API
  async getUsageData(dateRange: DateRange): Promise<OpenAIUsageData>
  
  // Pull billing/cost data
  async getBillingData(period: string): Promise<OpenAIBillingData>
  
  // Pull audit logs
  async getAuditLogs(filters: AuditFilters): Promise<OpenAIAuditLog[]>
  
  // Get API key usage breakdown
  async getAPIKeyUsage(apiKeyId?: string): Promise<APIKeyUsage[]>
}
```

#### 1.2 Anthropic Admin Service
**File**: `server/src/services/aiProviderServices/anthropicAdminService.ts`

```typescript
export class AnthropicAdminService {
  // Pull usage report from Anthropic API
  async getUsageReport(params: UsageReportParams): Promise<AnthropicUsageReport>
  
  // Pull cost report
  async getCostReport(params: CostReportParams): Promise<AnthropicCostReport>
  
  // Get workspace/project breakdown
  async getProjectUsage(workspaceId?: string): Promise<ProjectUsage[]>
}
```

#### 1.3 Combined Aggregation Service
**File**: `server/src/services/aiProviderServices/combinedAIUsageService.ts`

```typescript
export class CombinedAIUsageService {
  // Merge OpenAI + Anthropic + our metrics
  async getCombinedUsage(dateRange: DateRange): Promise<CombinedUsageData>
  
  // Calculate trends and comparisons
  async getUsageTrends(period: string): Promise<UsageTrends>
  
  // Provider comparison
  async compareProviders(metrics: string[]): Promise<ProviderComparison>
}
```

### Phase 2: API Routes

#### 2.1 New Routes
**File**: `server/src/routes/ai-provider-usage.ts`

```typescript
// GET /api/admin/ai-usage/combined
router.get('/combined', authenticateJWT, requireAdmin, async (req, res) => {
  // Return combined view data
});

// GET /api/admin/ai-usage/openai
router.get('/openai', authenticateJWT, requireAdmin, async (req, res) => {
  // Return OpenAI official data
});

// GET /api/admin/ai-usage/anthropic
router.get('/anthropic', authenticateJWT, requireAdmin, async (req, res) => {
  // Return Anthropic official data
});
```

### Phase 3: Frontend Implementation

#### 3.1 Update Admin Portal Page
**File**: `web/src/app/admin-portal/ai-system/page.tsx`

Add three tabs:
- **Combined** - Shows aggregated view with charts comparing both providers
- **OpenAI** - Shows official OpenAI data in their format
- **Anthropic** - Shows official Anthropic data in their format

#### 3.2 Components
- `CombinedUsageView.tsx` - Aggregated dashboard
- `OpenAIUsageView.tsx` - OpenAI-specific view
- `AnthropicUsageView.tsx` - Anthropic-specific view

### Phase 4: Secret Management

#### 4.1 Store Admin Credentials
Add to Secret Manager:
- `openai-admin-api-key` - OpenAI admin API key (different from regular API key)
- `anthropic-admin-api-key` - Anthropic admin credentials (if different)

Update `cloudbuild.yaml` to include these secrets in Cloud Run.

### Phase 5: Data Synchronization

#### 5.1 Scheduled Sync Job
**File**: `server/src/jobs/syncAIProviderUsage.ts`

Run daily/hourly to:
- Pull latest data from both providers
- Store in our database for historical tracking
- Cache for fast dashboard loading

## Data Schema

### Combined Usage Data
```typescript
interface CombinedUsageData {
  dateRange: DateRange;
  summary: {
    totalCost: number;
    openaiCost: number;
    anthropicCost: number;
    totalTokens: number;
    totalRequests: number;
  };
  byProvider: {
    openai: ProviderUsage;
    anthropic: ProviderUsage;
  };
  trends: {
    cost: TimeSeriesData;
    tokens: TimeSeriesData;
    requests: TimeSeriesData;
  };
  ourMetrics: {
    avgConfidence: number;
    userSatisfaction: number;
    avgResponseTime: number;
  };
}
```

## Benefits

1. **No Duplication**: Use official APIs as source of truth
2. **Accuracy**: Official billing data matches invoices
3. **Transparency**: Admins can see exact provider data
4. **Unified View**: Combined tab shows big picture
5. **Audit Trail**: Access to provider audit logs

## Notes

- OpenAI admin keys require Organization Owner role
- Anthropic Usage & Cost API available for all orgs
- Anthropic audit logs require Enterprise plan
- Cache provider data to reduce API calls
- Handle rate limits gracefully
- Store historical data for trend analysis
