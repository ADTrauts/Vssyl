import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CORE_ROUTE_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.core.ts',
);
const ANALYTICS_OPS_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts',
);
const PLATFORM_ROUTE_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.platform.ts',
);

describe('admin portal billing/analytics/support route extraction (1B-A.3)', () => {
  it('core dashboard routes delegate to adminAnalyticsService without prisma', () => {
    const source = readFileSync(CORE_ROUTE_PATH, 'utf8');

    expect(source).toContain('adminAnalyticsService.getDashboardStatsWithTrends');
    expect(source).toContain('adminAnalyticsService.getRecentDashboardActivity');
    expect(source).not.toContain('prisma.');
    expect(source).not.toContain('auditLog.create');
  });

  it('analyticsOps billing and analytics routes delegate to extracted services', () => {
    const source = readFileSync(ANALYTICS_OPS_PATH, 'utf8');

    expect(source).toContain('adminModuleGovernanceService.getModuleAnalytics');
    expect(source).toContain('adminModuleGovernanceService.getDeveloperStats');
    expect(source).toContain('adminModuleGovernanceService.updateModuleStatus');
    expect(source).not.toContain('AdminService.getModuleAnalytics');
    expect(source).toContain('adminBillingService.getSubscriptions');
    expect(source).toContain('adminBillingService.getPayments');
    expect(source).toContain('adminBillingService.getDeveloperPayouts');
    expect(source).toContain('adminAnalyticsService.getSystemMetricsForTimeRange');
    expect(source).toContain('adminAnalyticsService.getUserAnalyticsGrouped');
    expect(source).toContain('adminAnalyticsService.getAnalytics');
    expect(source).toContain('adminAnalyticsService.exportAnalytics');
    expect(source).toContain('adminAnalyticsService.getRealTimeMetrics');
    expect(source).not.toContain('auditLog.create');
  });

  it('platform support and BI routes delegate to extracted services', () => {
    const source = readFileSync(PLATFORM_ROUTE_PATH, 'utf8');

    expect(source).toContain('adminSupportService.getSupportTickets');
    expect(source).toContain('adminSupportService.createSupportTicket');
    expect(source).toContain('adminSupportService.updateSupportTicket');
    expect(source).toContain('adminAnalyticsService.getBusinessIntelligence');
    expect(source).toContain('adminAnalyticsService.generateCustomReport');
    expect(source).not.toContain('auditLog.create');
  });
});
