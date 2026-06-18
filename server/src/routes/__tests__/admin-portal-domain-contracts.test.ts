import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => ({
      cpu: 20,
      memory: 30,
      disk: 40,
      network: 5,
      uptime: '1d',
      responseTime: 10,
      activeConnections: 2,
      errorRate: 0,
      timestamp: new Date(),
    })),
    getBackupStatus: vi.fn(async () => ({
      lastBackup: new Date().toISOString(),
      nextBackup: new Date().toISOString(),
      backupSize: '1 GB',
      status: 'healthy' as const,
      retentionDays: 30,
    })),
    getMaintenanceMode: vi.fn(async () => ({
      enabled: false,
      message: 'ok',
    })),
    setMaintenanceMode: vi.fn(async () => undefined),
  },
}));

type DomainContract = {
  domain: string;
  method: 'get' | 'post' | 'put' | 'patch';
  path: string;
  body?: Record<string, unknown>;
};

const DOMAIN_CONTRACTS: DomainContract[] = [
  { domain: 'users', method: 'get', path: '/api/admin-portal/users' },
  { domain: 'users', method: 'get', path: `/api/admin-portal/users/__self__` },
  { domain: 'impersonation', method: 'get', path: '/api/admin-portal/impersonation/current' },
  { domain: 'impersonation', method: 'get', path: '/api/admin-portal/impersonation/history' },
  { domain: 'support', method: 'get', path: '/api/admin-portal/support/tickets' },
  { domain: 'support', method: 'get', path: '/api/admin-portal/support/stats' },
  { domain: 'billing', method: 'get', path: '/api/admin-portal/billing/subscriptions' },
  { domain: 'billing', method: 'get', path: '/api/admin-portal/billing/payments' },
  { domain: 'module-governance', method: 'get', path: '/api/admin-portal/modules/submissions' },
  { domain: 'module-governance', method: 'get', path: '/api/admin-portal/modules/stats' },
  { domain: 'moderation', method: 'get', path: '/api/admin-portal/moderation/stats' },
  { domain: 'moderation', method: 'get', path: '/api/admin-portal/moderation/reported' },
  { domain: 'security', method: 'get', path: '/api/admin-portal/security/events' },
  { domain: 'security', method: 'get', path: '/api/admin-portal/security/audit-logs' },
  { domain: 'system-ops', method: 'get', path: '/api/admin-portal/system/health' },
  { domain: 'system-ops', method: 'get', path: '/api/admin-portal/system/config' },
  { domain: 'performance', method: 'get', path: '/api/admin-portal/performance/metrics' },
  { domain: 'performance', method: 'get', path: '/api/admin-portal/performance/alerts' },
  { domain: 'analytics', method: 'get', path: '/api/admin-portal/analytics' },
  { domain: 'analytics', method: 'get', path: '/api/admin-portal/dashboard/stats' },
  { domain: 'ai-pipeline', method: 'get', path: '/api/admin-portal/ai-pipeline/catalog' },
];

describe('admin portal domain route contracts (1B-D / AP-F-027)', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  describe.each(DOMAIN_CONTRACTS)('$domain $method $path', (contract) => {
    it('allows admin and returns non-auth-failure status', async () => {
      const resolvedPath = contract.path.replace('__self__', adminUser.id);
      const req = request(app)[contract.method](resolvedPath).set(createAuthHeader(adminUser));
      if (contract.body) {
        req.send(contract.body);
      }
      const response = await req;
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('rejects non-admin', async () => {
      const resolvedPath = contract.path.replace('__self__', regularUser.id);
      const req = request(app)[contract.method](resolvedPath).set(createAuthHeader(regularUser));
      await req.expect(403);
    });
  });

  describe('mutation and audit-adjacent contracts', () => {
    it('POST impersonation denied self-target emits audit-eligible 403', async () => {
      const response = await request(app)
        .post(`/api/admin-portal/users/${adminUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: '1B-D contract test' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('PATCH system config mutation reaches adminSystemOpsService path', async () => {
      const response = await request(app)
        .patch('/api/admin-portal/system/config/1bd_contract_key')
        .set(createAuthHeader(adminUser))
        .send({ configValue: 'true', description: '1B-D contract' });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('dangerous migration delete remains env-gated for admin', async () => {
      const response = await request(app)
        .post('/api/admin-portal/database/migrations/delete')
        .set(createAuthHeader(adminUser))
        .send({ migrationName: '1bd_test', confirm: 'DELETE_PRISMA_MIGRATION' })
        .expect(403);

      expect(response.body.error).toMatch(/disabled|Confirmation|Invalid/i);
    });
  });
});
