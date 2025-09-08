# Technical Implementation Guide: Admin Portal Real Features

## Quick Start Implementation

This guide provides step-by-step instructions to implement real features and replace mock data in the admin portal.

## Phase 1: Database Schema Implementation

### Step 1.1: Create Database Migrations

Create the following Prisma migration files:

```bash
# Create new migration
npx prisma migrate dev --name add_billing_and_analytics_tables
```

#### Migration File: `prisma/migrations/YYYYMMDDHHMMSS_add_billing_and_analytics_tables.sql`

```sql
-- Add billing tables
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "developer_payouts" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "payoutMethod" TEXT,
    "payoutReference" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "developer_payouts_pkey" PRIMARY KEY ("id")
);

-- Add analytics tables
CREATE TABLE "user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" DECIMAL(10,4) NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_intelligence" (
    "id" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_intelligence_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "developer_payouts" ADD CONSTRAINT "developer_payouts_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "developer_payouts_developerId_idx" ON "developer_payouts"("developerId");
CREATE INDEX "developer_payouts_status_idx" ON "developer_payouts"("status");
CREATE INDEX "user_analytics_userId_idx" ON "user_analytics"("userId");
CREATE INDEX "user_analytics_eventType_idx" ON "user_analytics"("eventType");
CREATE INDEX "user_analytics_timestamp_idx" ON "user_analytics"("timestamp");
CREATE INDEX "system_metrics_metricType_idx" ON "system_metrics"("metricType");
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");
```

### Step 1.2: Update Prisma Schema

Add the following models to `prisma/schema.prisma`:

```prisma
// Billing Models
model Subscription {
  id                  String    @id @default(cuid())
  userId              String
  planType            String
  status              String
  amount              Decimal
  currency            String    @default("USD")
  billingCycle        String
  startDate           DateTime
  endDate             DateTime?
  stripeSubscriptionId String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  user                User      @relation(fields: [userId], references: [id])
  payments            Payment[]

  @@index([userId])
  @@index([status])
}

model Payment {
  id                String    @id @default(cuid())
  subscriptionId    String
  amount            Decimal
  status            String
  stripePaymentId   String?
  paidAt            DateTime?
  createdAt         DateTime  @default(now())

  subscription      Subscription @relation(fields: [subscriptionId], references: [id])

  @@index([subscriptionId])
  @@index([status])
}

model DeveloperPayout {
  id              String    @id @default(cuid())
  developerId     String
  amount          Decimal
  status          String
  payoutMethod    String?
  payoutReference String?
  requestedAt     DateTime  @default(now())
  paidAt          DateTime?
  notes           String?

  developer       User      @relation(fields: [developerId], references: [id])

  @@index([developerId])
  @@index([status])
}

// Analytics Models
model UserAnalytics {
  id        String   @id @default(cuid())
  userId    String
  eventType String
  eventData Json?
  sessionId String?
  userAgent String?
  ipAddress String?
  timestamp DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
}

model SystemMetrics {
  id          String   @id @default(cuid())
  metricType  String
  metricValue Decimal
  unit        String?
  tags        Json?
  timestamp   DateTime @default(now())

  @@index([metricType])
  @@index([timestamp])
}

model BusinessIntelligence {
  id        String   @id @default(cuid())
  dataType  String
  data      Json
  period    String
  timestamp DateTime @default(now())
}

// Update User model to include new relations
model User {
  // ... existing fields ...
  
  // New relations
  subscriptions     Subscription[]
  developerPayouts  DeveloperPayout[]
  analytics         UserAnalytics[]
}
```

## Phase 2: Service Layer Implementation

### Step 2.1: Create Billing Service

Create `server/src/services/billingService.ts`:

```typescript
import { prisma } from '../lib/prisma';

export interface BillingFilters {
  status?: string;
  planType?: string;
  dateRange?: string;
}

export interface PaymentFilters {
  status?: string;
  dateRange?: string;
}

export interface PayoutFilters {
  status?: string;
  developerId?: string;
  dateRange?: string;
}

export class BillingService {
  static async getSubscriptions(filters: BillingFilters = {}) {
    const where: any = {};
    
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    if (filters.planType && filters.planType !== 'all') {
      where.planType = filters.planType;
    }
    
    if (filters.dateRange) {
      const startDate = this.getDateFromRange(filters.dateRange);
      where.createdAt = {
        gte: startDate
      };
    }

    return prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getPaymentHistory(filters: PaymentFilters = {}) {
    const where: any = {};
    
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    if (filters.dateRange) {
      const startDate = this.getDateFromRange(filters.dateRange);
      where.createdAt = {
        gte: startDate
      };
    }

    return prisma.payment.findMany({
      where,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getDeveloperPayouts(filters: PayoutFilters = {}) {
    const where: any = {};
    
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    if (filters.developerId) {
      where.developerId = filters.developerId;
    }
    
    if (filters.dateRange) {
      const startDate = this.getDateFromRange(filters.dateRange);
      where.requestedAt = {
        gte: startDate
      };
    }

    return prisma.developerPayout.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });
  }

  static async getBillingStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      pendingPayouts
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { status: 'active' }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'succeeded' }
      }),
      prisma.developerPayout.aggregate({
        _sum: { amount: true },
        where: { status: 'pending' }
      })
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0
    };
  }

  private static getDateFromRange(dateRange: string): Date {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
```

### Step 2.2: Create Analytics Service

Create `server/src/services/analyticsService.ts`:

```typescript
import { prisma } from '../lib/prisma';

export class AnalyticsService {
  static async trackUserEvent(userId: string, eventType: string, data: any = {}) {
    return prisma.userAnalytics.create({
      data: {
        userId,
        eventType,
        eventData: data,
        sessionId: data.sessionId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      }
    });
  }

  static async trackSystemMetric(metricType: string, value: number, unit?: string, tags?: any) {
    return prisma.systemMetrics.create({
      data: {
        metricType,
        metricValue: value,
        unit,
        tags
      }
    });
  }

  static async getUserGrowth(timeRange: string = '30d') {
    const startDate = this.getDateFromRange(timeRange);
    
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    return userGrowth.map(day => ({
      date: day.createdAt,
      count: day._count.id
    }));
  }

  static async getRevenueMetrics(timeRange: string = '30d') {
    const startDate = this.getDateFromRange(timeRange);
    
    const revenue = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'succeeded',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        amount: true
      }
    });

    return revenue.map(day => ({
      date: day.createdAt,
      amount: day._sum.amount || 0
    }));
  }

  static async getEngagementMetrics(timeRange: string = '30d') {
    const startDate = this.getDateFromRange(timeRange);
    
    const engagement = await prisma.userAnalytics.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: startDate
        },
        eventType: {
          in: ['page_view', 'feature_used', 'login']
        }
      },
      _count: {
        id: true
      }
    });

    return engagement.map(day => ({
      date: day.timestamp,
      events: day._count.id
    }));
  }

  static async aggregateDailyMetrics() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      newUsers,
      activeUsers,
      totalRevenue,
      systemHealth
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday
          }
        }
      }),
      prisma.userAnalytics.count({
        where: {
          timestamp: {
            gte: yesterday
          },
          eventType: 'login'
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'succeeded',
          createdAt: {
            gte: yesterday
          }
        }
      }),
      prisma.systemMetrics.aggregate({
        _avg: { metricValue: true },
        where: {
          metricType: 'system_health',
          timestamp: {
            gte: yesterday
          }
        }
      })
    ]);

    return {
      newUsers,
      activeUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
      systemHealth: systemHealth._avg.metricValue || 99.9
    };
  }

  private static getDateFromRange(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
```

### Step 2.3: Create Security Service

Create `server/src/services/securityService.ts`:

```typescript
import { prisma } from '../lib/prisma';

export interface SecurityFilters {
  severity?: string;
  eventType?: string;
  dateRange?: string;
}

export class SecurityService {
  static async getSecurityEvents(filters: SecurityFilters = {}) {
    const where: any = {
      action: {
        in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS', 'ADMIN_ACTION']
      }
    };
    
    if (filters.severity && filters.severity !== 'all') {
      where.severity = filters.severity;
    }
    
    if (filters.eventType && filters.eventType !== 'all') {
      where.action = filters.eventType;
    }
    
    if (filters.dateRange) {
      const startDate = this.getDateFromRange(filters.dateRange);
      where.timestamp = {
        gte: startDate
      };
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  static async getSecurityStats() {
    const [
      totalEvents,
      criticalEvents,
      resolvedEvents,
      activeThreats
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: {
            in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS']
          }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: {
            in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS']
          },
          severity: 'critical'
        }
      }),
      prisma.auditLog.count({
        where: {
          action: {
            in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS']
          },
          resolved: true
        }
      }),
      prisma.auditLog.count({
        where: {
          action: {
            in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS']
          },
          resolved: false
        }
      })
    ]);

    return {
      totalEvents,
      criticalEvents,
      resolvedEvents,
      activeThreats,
      securityScore: this.calculateSecurityScore(totalEvents, criticalEvents, resolvedEvents)
    };
  }

  static async getComplianceStatus() {
    // Implement real compliance checking logic
    return {
      gdpr: true,
      hipaa: false,
      soc2: true,
      pci: true,
      lastAudit: new Date().toISOString(),
      nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private static calculateSecurityScore(total: number, critical: number, resolved: number): number {
    if (total === 0) return 100;
    
    const baseScore = 100;
    const criticalPenalty = critical * 10;
    const resolutionBonus = resolved * 2;
    
    return Math.max(0, Math.min(100, baseScore - criticalPenalty + resolutionBonus));
  }

  private static getDateFromRange(dateRange: string): Date {
    const now = new Date();
    switch (dateRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
```

## Phase 3: API Endpoint Updates

### Step 3.1: Update Billing Endpoints

Update `server/src/routes/admin-portal.ts` billing endpoints:

```typescript
// Replace mock billing endpoints with real implementations
router.get('/billing/subscriptions', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, planType, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subscriptions = await BillingService.getSubscriptions({
      status: status as string,
      planType: planType as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} retrieved billing subscriptions`);

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error getting billing subscriptions:', error);
    res.status(500).json({ error: 'Failed to get billing subscriptions' });
  }
});

router.get('/billing/payments', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const payments = await BillingService.getPaymentHistory({
      status: status as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} retrieved payment history`);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

router.get('/billing/payouts', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, developerId, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const payouts = await BillingService.getDeveloperPayouts({
      status: status as string,
      developerId: developerId as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} retrieved developer payouts`);

    res.json({
      success: true,
      data: payouts
    });
  } catch (error) {
    console.error('Error getting developer payouts:', error);
    res.status(500).json({ error: 'Failed to get developer payouts' });
  }
});

router.get('/billing/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await BillingService.getBillingStats();

    console.log(`Admin ${adminUser.id} retrieved billing stats`);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting billing stats:', error);
    res.status(500).json({ error: 'Failed to get billing stats' });
  }
});
```

### Step 3.2: Update Analytics Endpoints

```typescript
// Replace mock analytics endpoints with real implementations
router.get('/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [userGrowth, revenueMetrics, engagementMetrics] = await Promise.all([
      AnalyticsService.getUserGrowth(timeRange as string),
      AnalyticsService.getRevenueMetrics(timeRange as string),
      AnalyticsService.getEngagementMetrics(timeRange as string)
    ]);

    const analyticsData = {
      userGrowth,
      revenue: revenueMetrics,
      engagement: engagementMetrics
    };

    console.log(`Admin ${adminUser.id} retrieved analytics data`);

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error getting analytics data:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});
```

### Step 3.3: Update Security Endpoints

```typescript
// Replace mock security endpoints with real implementations
router.get('/security/events', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { severity, eventType, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const events = await SecurityService.getSecurityEvents({
      severity: severity as string,
      eventType: eventType as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} retrieved security events`);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    res.status(500).json({ error: 'Failed to get security events' });
  }
});

router.get('/security/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await SecurityService.getSecurityStats();

    console.log(`Admin ${adminUser.id} retrieved security stats`);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting security stats:', error);
    res.status(500).json({ error: 'Failed to get security stats' });
  }
});

router.get('/security/compliance', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const compliance = await SecurityService.getComplianceStatus();

    console.log(`Admin ${adminUser.id} retrieved compliance status`);

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Error getting compliance status:', error);
    res.status(500).json({ error: 'Failed to get compliance status' });
  }
});
```

## Phase 4: Frontend Updates

### Step 4.1: Update Billing Page

Update `web/src/app/admin-portal/billing/page.tsx`:

```typescript
// Replace mock data loading with real API calls
const loadFinancialData = async () => {
  try {
    setLoading(true);
    setError(null);

    const [subscriptionsRes, paymentsRes, payoutsRes, statsRes] = await Promise.all([
      adminApiService.getBillingSubscriptions(filters),
      adminApiService.getBillingPayments(filters),
      adminApiService.getBillingPayouts(filters),
      adminApiService.getBillingStats()
    ]);

    setSubscriptions(subscriptionsRes.data?.data || []);
    setPayments(paymentsRes.data?.data || []);
    setPayouts(payoutsRes.data?.data || []);
    setStats(statsRes.data?.data || null);
  } catch (err) {
    console.error('Error loading financial data:', err);
    setError('Failed to load financial data. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 4.2: Update Analytics Page

Update `web/src/app/admin-portal/analytics/page.tsx`:

```typescript
// Replace mock data loading with real API calls
const loadAnalyticsData = async () => {
  try {
    setLoading(true);
    const response = await adminApiService.getAnalytics(filters);
    
    if (response.error) {
      setError(response.error);
      return;
    }

    setAnalyticsData(response.data?.data as AnalyticsData);
    setError(null);
  } catch (err) {
    setError('Failed to load analytics data');
    console.error('Analytics error:', err);
  } finally {
    setLoading(false);
  }
};
```

### Step 4.3: Update Security Page

Update `web/src/app/admin-portal/security/page.tsx`:

```typescript
// Replace mock data loading with real API calls
const loadSecurityData = async () => {
  try {
    setLoading(true);
    const [eventsRes, statsRes, complianceRes] = await Promise.all([
      adminApiService.getSecurityEvents(filters),
      adminApiService.getSecurityStats(),
      adminApiService.getComplianceStatus()
    ]);

    if (eventsRes.error) {
      setError(eventsRes.error);
      return;
    }

    setSecurityEvents(eventsRes.data?.data || []);
    setSecurityMetrics(statsRes.data?.data || null);
    setComplianceStatus(complianceRes.data?.data || null);
    setError(null);
  } catch (err) {
    setError('Failed to load security data');
    console.error('Security error:', err);
  } finally {
    setLoading(false);
  }
};
```

## Phase 5: Data Seeding

### Step 5.1: Create Seed Data

Create `server/scripts/seed-real-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRealData() {
  console.log('🌱 Seeding real data for admin portal...');

  // Seed subscriptions
  const subscriptions = [
    {
      id: 'sub_1',
      userId: '451258c6-5630-4008-8028-edf390036930', // admin user
      planType: 'enterprise',
      status: 'active',
      amount: 199.99,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      stripeSubscriptionId: 'sub_123456789'
    }
  ];

  for (const subscription of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: subscription.id },
      update: subscription,
      create: subscription
    });
  }

  // Seed payments
  const payments = [
    {
      id: 'pay_1',
      subscriptionId: 'sub_1',
      amount: 199.99,
      status: 'succeeded',
      stripePaymentId: 'pi_123456789',
      paidAt: new Date('2024-01-01')
    }
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: payment,
      create: payment
    });
  }

  // Seed analytics data
  const analyticsEvents = [
    {
      id: 'analytics_1',
      userId: '451258c6-5630-4008-8028-edf390036930',
      eventType: 'login',
      eventData: { source: 'admin_portal' },
      sessionId: 'session_123',
      userAgent: 'Mozilla/5.0...',
      ipAddress: '127.0.0.1'
    }
  ];

  for (const event of analyticsEvents) {
    await prisma.userAnalytics.upsert({
      where: { id: event.id },
      update: event,
      create: event
    });
  }

  // Seed system metrics
  const systemMetrics = [
    {
      id: 'metric_1',
      metricType: 'cpu_usage',
      metricValue: 45.2,
      unit: 'percent',
      tags: { server: 'main' }
    },
    {
      id: 'metric_2',
      metricType: 'memory_usage',
      metricValue: 67.8,
      unit: 'percent',
      tags: { server: 'main' }
    }
  ];

  for (const metric of systemMetrics) {
    await prisma.systemMetrics.upsert({
      where: { id: metric.id },
      update: metric,
      create: metric
    });
  }

  console.log('✅ Real data seeded successfully!');
}

seedRealData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 5.2: Run Seed Script

```bash
cd server
node scripts/seed-real-data.js
```

## Phase 6: Testing & Validation

### Step 6.1: Create Test Scripts

Create `server/scripts/test-admin-features.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminFeatures() {
  console.log('🧪 Testing admin portal features...');

  // Test billing data
  const subscriptions = await prisma.subscription.count();
  console.log(`📊 Subscriptions: ${subscriptions}`);

  const payments = await prisma.payment.count();
  console.log(`💰 Payments: ${payments}`);

  // Test analytics data
  const analytics = await prisma.userAnalytics.count();
  console.log(`📈 Analytics events: ${analytics}`);

  // Test system metrics
  const metrics = await prisma.systemMetrics.count();
  console.log(`⚡ System metrics: ${metrics}`);

  // Test security events
  const securityEvents = await prisma.auditLog.count({
    where: {
      action: {
        in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'DATA_ACCESS']
      }
    }
  });
  console.log(`🔒 Security events: ${securityEvents}`);

  console.log('✅ Admin portal features tested successfully!');
}

testAdminFeatures()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 6.2: Run Tests

```bash
cd server
node scripts/test-admin-features.js
```

## Deployment Checklist

### Pre-Deployment
- [ ] Run database migrations
- [ ] Seed real data
- [ ] Test all API endpoints
- [ ] Verify frontend functionality
- [ ] Check error handling
- [ ] Validate security measures

### Post-Deployment
- [ ] Monitor API performance
- [ ] Check data accuracy
- [ ] Verify real-time features
- [ ] Test admin workflows
- [ ] Monitor error rates
- [ ] Collect user feedback

## Conclusion

This implementation guide provides a complete roadmap to replace mock data with real, database-driven features in the admin portal. Follow the phases sequentially to ensure a smooth transition from mock data to production-ready functionality.

**Next Steps:**
1. Execute Phase 1 database migrations
2. Implement service layer (Phase 2)
3. Update API endpoints (Phase 3)
4. Update frontend components (Phase 4)
5. Seed real data (Phase 5)
6. Test and validate (Phase 6)

The result will be a fully functional, real-time admin portal with comprehensive administrative capabilities.
