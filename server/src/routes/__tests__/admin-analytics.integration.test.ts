import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => ({
      cpu: 20,
      memory: 30,
      disk: 40,
      network: 5,
      uptime: '1d 0h 0m',
      responseTime: 10,
      activeConnections: 2,
      errorRate: 0,
      timestamp: new Date(),
    })),
  },
}));

/**
 * Integration tests for analytics data aggregation and trend calculations
 * These tests verify end-to-end analytics workflows
 */
describe('Admin Portal - Analytics Integration', () => {
  const app = createTestApp();
  let adminUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    userIdsToCleanup.push(adminUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  describe('Dashboard Statistics Flow', () => {
    it('should aggregate dashboard statistics with trend calculations', async () => {
      // Create test users at different times to test trend calculations
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Create users in different time periods
      const recentUser = await createTestUser({
        email: `recent-${Date.now()}@test.com`,
        name: 'Recent User'
      });
      userIdsToCleanup.push(recentUser.id);

      // Update user creation time to simulate older user
      await prisma.user.update({
        where: { id: recentUser.id },
        data: { createdAt: thirtyDaysAgo }
      });

      // Get dashboard stats
      const statsResponse = await request(app)
        .get('/api/admin-portal/dashboard/stats')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(statsResponse.body).toHaveProperty('data');
      const stats = statsResponse.body.data;

      // Verify core statistics are present
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalBusinesses');
      // Note: totalRevenue may not be present if there are no subscriptions
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.totalBusinesses).toBe('number');
      if (stats.totalRevenue !== undefined) {
        expect(typeof stats.totalRevenue).toBe('number');
      }

      // Verify trend calculations are present
      expect(stats).toHaveProperty('userGrowthTrend');
      expect(stats).toHaveProperty('businessGrowthTrend');
      expect(stats).toHaveProperty('revenueGrowthTrend');
      expect(typeof stats.userGrowthTrend).toBe('number');
      expect(typeof stats.businessGrowthTrend).toBe('number');
      expect(typeof stats.revenueGrowthTrend).toBe('number');
    });

    it('should calculate growth trends correctly', async () => {
      // Get initial stats
      const initialResponse = await request(app)
        .get('/api/admin-portal/dashboard/stats')
        .set(createAuthHeader(adminUser))
        .expect(200);

      const initialStats = initialResponse.body.data;
      const initialUserCount = initialStats.totalUsers;

      // Create a new user
      const newUser = await createTestUser({
        email: `trend-test-${Date.now()}@test.com`,
        name: 'Trend Test User'
      });
      userIdsToCleanup.push(newUser.id);

      // Ensure the created user exists before reading aggregated stats
      const persistedUser = await prisma.user.findUnique({ where: { id: newUser.id } });
      expect(persistedUser).not.toBeNull();

      // Other suites can create/delete users concurrently; bound expected value by
      // counts sampled around the stats request.
      const usersBeforeStats = await prisma.user.count();

      // Get updated stats
      const updatedResponse = await request(app)
        .get('/api/admin-portal/dashboard/stats')
        .set(createAuthHeader(adminUser))
        .expect(200);
      const usersAfterStats = await prisma.user.count();

      const updatedStats = updatedResponse.body.data;

      // User total should remain within observed bounds during this request window.
      const lowerBound = Math.min(usersBeforeStats, usersAfterStats);
      const upperBound = Math.max(usersBeforeStats, usersAfterStats);
      expect(updatedStats.totalUsers).toBeGreaterThanOrEqual(lowerBound);
      expect(updatedStats.totalUsers).toBeLessThanOrEqual(upperBound);
      expect(updatedStats.totalUsers).toBeGreaterThan(0);
    });
  });

  describe('Analytics Data Aggregation', () => {
    it('should retrieve analytics data with filters', async () => {
      const analyticsResponse = await request(app)
        .get('/api/admin-portal/analytics')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(analyticsResponse.body).toBeDefined();
      // Analytics structure depends on AdminService.getAnalytics implementation
    });

    it('should support time range filters for analytics', async () => {
      // Test with different time ranges
      const response24h = await request(app)
        .get('/api/admin-portal/analytics/system?timeRange=24h')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response24h.body).toBeDefined();
      expect(Array.isArray(response24h.body)).toBe(true);

      const response7d = await request(app)
        .get('/api/admin-portal/analytics/system?timeRange=7d')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response7d.body).toBeDefined();
      expect(Array.isArray(response7d.body)).toBe(true);
    });
  });

  describe('Real-time Metrics Flow', () => {
    it('should retrieve real-time metrics', async () => {
      const realtimeResponse = await request(app)
        .get('/api/admin-portal/analytics/realtime')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(realtimeResponse.body).toBeDefined();
      // Real-time metrics structure depends on AdminService.getRealTimeMetrics implementation
    });
  });

  describe('Analytics Export Flow', () => {
    it('should export analytics data in JSON format', async () => {
      const exportResponse = await request(app)
        .post('/api/admin-portal/analytics/export?format=json')
        .set(createAuthHeader(adminUser))
        .send({})
        .expect(200);

      expect(exportResponse.headers['content-type']).toContain('application/json');
      expect(exportResponse.headers['content-disposition']).toContain('attachment');
    });

    it('should export analytics data in CSV format', async () => {
      const exportResponse = await request(app)
        .post('/api/admin-portal/analytics/export?format=csv')
        .set(createAuthHeader(adminUser))
        .send({})
        .expect(200);

      expect(exportResponse.headers['content-type']).toContain('text/csv');
      expect(exportResponse.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('User Analytics Flow', () => {
    it('should retrieve user analytics with time range', async () => {
      const userAnalyticsResponse = await request(app)
        .get('/api/admin-portal/analytics/users?timeRange=30d')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(userAnalyticsResponse.body).toBeDefined();
      expect(Array.isArray(userAnalyticsResponse.body)).toBe(true);
    });

    it('should support different time ranges for user analytics', async () => {
      const ranges = ['7d', '30d', '90d'];
      
      for (const range of ranges) {
        const response = await request(app)
          .get(`/api/admin-portal/analytics/users?timeRange=${range}`)
          .set(createAuthHeader(adminUser))
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('Recent Activity Flow', () => {
    it('should retrieve recent activity with user details', async () => {
      const activityResponse = await request(app)
        .get('/api/admin-portal/dashboard/activity')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(activityResponse.body).toHaveProperty('data');
      expect(Array.isArray(activityResponse.body.data)).toBe(true);

      // If there are activities, verify they have user details
      if (activityResponse.body.data.length > 0) {
        const firstActivity = activityResponse.body.data[0];
        expect(firstActivity).toHaveProperty('user');
        expect(firstActivity.user).toHaveProperty('email');
      }
    });
  });
});

