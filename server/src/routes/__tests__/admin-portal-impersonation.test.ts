import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ADMIN_AUDIT_ACTIONS } from '../../services/admin/adminAuditTaxonomy';

describe('Admin Portal - Impersonation', () => {
  const app = createTestApp();
  let adminUser: User;
  let targetUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    targetUser = await createTestUser({ name: 'Target User' });
    userIdsToCleanup.push(adminUser.id, targetUser.id);
  });

  beforeEach(async () => {
    await prisma.adminImpersonation.updateMany({
      where: { adminId: adminUser.id, endedAt: null },
      data: { endedAt: new Date() },
    });
    await prisma.auditLog.deleteMany({
      where: {
        userId: adminUser.id,
        action: {
          in: [
            ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
            ADMIN_AUDIT_ACTIONS.IMPERSONATION_END,
            ADMIN_AUDIT_ACTIONS.IMPERSONATION_DENIED,
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.adminImpersonation.deleteMany({
      where: { adminId: adminUser.id },
    });
    await cleanupTestUsers(userIdsToCleanup);
  });

  describe('POST /api/admin-portal/users/:userId/impersonate', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .send({ reason: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should start impersonation for admin', async () => {
      const response = await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({
          reason: 'Test impersonation',
          expiresInMinutes: 60,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Impersonation started successfully');
      expect(response.body).toHaveProperty('impersonation');
      expect(response.body.impersonation).toHaveProperty('id');
      expect(response.body.impersonation.targetUser).toHaveProperty('id', targetUser.id);
      expect(response.body.impersonation.targetUser).toHaveProperty('email', targetUser.email);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.impersonation.targetUser).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('password');
    });

    it('should reject impersonation from non-admin', async () => {
      const regularUser = await createTestUser();
      userIdsToCleanup.push(regularUser.id);

      const response = await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(regularUser))
        .send({ reason: 'Test' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should reject impersonation of non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/admin-portal/users/${fakeUserId}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should reject self-impersonation', async () => {
      const response = await request(app)
        .post(`/api/admin-portal/users/${adminUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Self test' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Cannot impersonate your own account');

      const denial = await prisma.auditLog.findFirst({
        where: {
          userId: adminUser.id,
          action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_DENIED,
          resourceId: adminUser.id,
        },
      });
      expect(denial).not.toBeNull();
    });

    it('should reject impersonation of another admin', async () => {
      const otherAdmin = await createTestAdminUser();
      userIdsToCleanup.push(otherAdmin.id);

      const response = await request(app)
        .post(`/api/admin-portal/users/${otherAdmin.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Admin target test' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Cannot impersonate administrator accounts');
    });

    it('should reject impersonation of unverified accounts', async () => {
      const unverifiedUser = await createTestUser({
        name: 'Unverified User',
        emailVerified: null,
      });
      userIdsToCleanup.push(unverifiedUser.id);

      const response = await request(app)
        .post(`/api/admin-portal/users/${unverifiedUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Unverified test' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Cannot impersonate users with unverified accounts');
    });

    it('should audit-log impersonation start', async () => {
      const response = await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Audit start test' })
        .expect(200);

      const impersonationId = response.body.impersonation.id;

      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: adminUser.id,
          action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
          resourceId: impersonationId,
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(audit).not.toBeNull();
      expect(audit?.resourceType).toBe('impersonation_session');
      expect(audit?.adminImpersonationId).toBe(impersonationId);
    });

    it('should prevent multiple simultaneous impersonations', async () => {
      await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'First impersonation' })
        .expect(200);

      const anotherUser = await createTestUser();
      userIdsToCleanup.push(anotherUser.id);

      const response = await request(app)
        .post(`/api/admin-portal/users/${anotherUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Second impersonation' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Admin is already impersonating a user');

      await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(adminUser))
        .expect(200);
    });
  });

  describe('POST /api/admin-portal/impersonation/end', () => {
    it('should end active impersonation', async () => {
      await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Test end impersonation' })
        .expect(200);

      const response = await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Impersonation ended successfully');
    });

    it('should audit-log impersonation end', async () => {
      const startResponse = await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Audit end test' })
        .expect(200);

      const impersonationId = startResponse.body.impersonation.id;

      await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(adminUser))
        .expect(200);

      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: adminUser.id,
          action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_END,
          resourceId: impersonationId,
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(audit).not.toBeNull();
      expect(audit?.resourceType).toBe('impersonation_session');
      expect(audit?.adminImpersonationId).toBe(impersonationId);
    });

    it('should return 404 if no active impersonation', async () => {
      const response = await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(adminUser))
        .expect(404);

      expect(response.body).toHaveProperty('error', 'No active impersonation session found');
    });

    it('should reject request from non-admin', async () => {
      const regularUser = await createTestUser();
      userIdsToCleanup.push(regularUser.id);

      const response = await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(regularUser))
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });
  });

  describe('GET /api/admin-portal/impersonation/current', () => {
    it('should return current impersonation if active', async () => {
      await request(app)
        .post(`/api/admin-portal/users/${targetUser.id}/impersonate`)
        .set(createAuthHeader(adminUser))
        .send({ reason: 'Test current impersonation' })
        .expect(200);

      const response = await request(app)
        .get('/api/admin-portal/impersonation/current')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response.body).toHaveProperty('active', true);
      expect(response.body).toHaveProperty('impersonation');
      expect(response.body.impersonation).toHaveProperty('id');
      expect(response.body.impersonation.targetUser).toHaveProperty('id', targetUser.id);
      expect(response.body.impersonation.targetUser).not.toHaveProperty('password');

      await request(app)
        .post('/api/admin-portal/impersonation/end')
        .set(createAuthHeader(adminUser))
        .expect(200);
    });

    it('should return inactive state if no active impersonation', async () => {
      const response = await request(app)
        .get('/api/admin-portal/impersonation/current')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response.body).toHaveProperty('active', false);
    });

    it('should reject request from non-admin', async () => {
      const regularUser = await createTestUser();
      userIdsToCleanup.push(regularUser.id);

      const response = await request(app)
        .get('/api/admin-portal/impersonation/current')
        .set(createAuthHeader(regularUser))
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });
  });
});
