/**
 * Phase 1B — Business Twin HTTP authorization via POST /api/ai/twin + context.businessId
 * (Canonical path — not the mock BusinessAIDigitalTwinService /interact wrapper.)
 */
import request from 'supertest';
import type { Business, User } from '@prisma/client';
import { BusinessRole } from '@prisma/client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestUsers,
  createAuthHeader,
  createTestAdminUser,
  createTestUser,
} from '../../__tests__/helpers/auth';
import {
  addBusinessMember,
  clearFakeProviders,
  cleanupAiPhase1bArtifacts,
  createTestBusiness,
  createTwinRealStackApp,
  ensureBusinessAIConfig,
  installFakeProviders,
} from '../../ai/__tests__/helpers/phase1bTwinTestApp';

describe('Phase 1B — Business Twin HTTP authorization', () => {
  const app = createTwinRealStackApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let businessA: Business;
  let businessB: Business;
  let memberA: User;
  let memberB: User;
  let outsider: User;
  let removed: User;
  let inactive: User;
  let adminMember: User;

  beforeAll(async () => {
    businessA = await createTestBusiness('Phase1B Biz A');
    businessB = await createTestBusiness('Phase1B Biz B');
    businessIds.push(businessA.id, businessB.id);

    memberA = await createTestUser({ name: 'BizA Member' });
    memberB = await createTestUser({ name: 'BizB Member' });
    outsider = await createTestUser({ name: 'Outsider' });
    removed = await createTestUser({ name: 'Removed' });
    inactive = await createTestUser({ name: 'Inactive' });
    adminMember = await createTestAdminUser({ name: 'Biz Admin Member' });
    userIds.push(memberA.id, memberB.id, outsider.id, removed.id, inactive.id, adminMember.id);

    await addBusinessMember({ businessId: businessA.id, userId: memberA.id, role: BusinessRole.EMPLOYEE });
    await addBusinessMember({ businessId: businessB.id, userId: memberB.id, role: BusinessRole.EMPLOYEE });
    await addBusinessMember({
      businessId: businessA.id,
      userId: removed.id,
      role: BusinessRole.EMPLOYEE,
      isActive: false,
    });
    await addBusinessMember({
      businessId: businessA.id,
      userId: inactive.id,
      role: BusinessRole.EMPLOYEE,
      isActive: false,
    });
    await addBusinessMember({
      businessId: businessA.id,
      userId: adminMember.id,
      role: BusinessRole.ADMIN,
    });

    await ensureBusinessAIConfig({ businessId: businessA.id, allowEmployeeInteraction: true });
    await ensureBusinessAIConfig({ businessId: businessB.id, allowEmployeeInteraction: true });
  });

  afterEach(() => {
    clearFakeProviders();
  });

  afterAll(async () => {
    await cleanupAiPhase1bArtifacts({ userIds, businessIds });
    await cleanupTestUsers(userIds);
  });

  it('active member can use twin with businessId', async () => {
    installFakeProviders({ type: 'text', response: 'biz-ok' });
    // Non-admin members need query balance; use admin member for balance skip while still testing membership
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(adminMember))
      .send({
        query: 'Hello business twin',
        provider: 'openai',
        context: { businessId: businessA.id },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('non-member is denied (403)', async () => {
    installFakeProviders({ type: 'text', response: 'should-not-run' });
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(outsider))
      .send({
        query: 'Hello',
        provider: 'openai',
        context: { businessId: businessA.id },
      });
    expect(res.status).toBe(403);
  });

  it('removed/inactive member is denied', async () => {
    installFakeProviders({ type: 'text', response: 'should-not-run' });
    const resRemoved = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(removed))
      .send({
        query: 'Hello',
        provider: 'openai',
        context: { businessId: businessA.id },
      });
    expect(resRemoved.status).toBe(403);

    const resInactive = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(inactive))
      .send({
        query: 'Hello',
        provider: 'openai',
        context: { businessId: businessA.id },
      });
    expect(resInactive.status).toBe(403);
  });

  it('business A member cannot use business B context', async () => {
    installFakeProviders({ type: 'text', response: 'should-not-run' });
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(memberA))
      .send({
        query: 'Hello',
        provider: 'openai',
        context: { businessId: businessB.id },
      });
    expect(res.status).toBe(403);
  });

  it('member of B cannot access A', async () => {
    installFakeProviders({ type: 'text', response: 'should-not-run' });
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(memberB))
      .send({
        query: 'Hello',
        provider: 'openai',
        context: { businessId: businessA.id },
      });
    expect(res.status).toBe(403);
  });
});
