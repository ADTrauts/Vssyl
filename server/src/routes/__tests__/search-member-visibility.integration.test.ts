import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import type { Business, User } from '@prisma/client';
import { BusinessRole } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import { globalSearch } from '../../controllers/searchController';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createSearchTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.post('/api/search', authenticateJWT, (req, res, next) => {
    void globalSearch(req, res);
  });
  return app;
}

async function createTestBusiness(name: string): Promise<Business> {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prisma.business.create({
    data: {
      name,
      ein: `TST${suffix}`,
    },
  });
}

describe('Global search — member provider tenant scope', () => {
  const app = createSearchTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let business: Business;
  let userInOrg: User;
  let colleague: User;
  let outsider: User;

  beforeAll(async () => {
    business = await createTestBusiness('Search Member Scope');
    businessIds.push(business.id);

    userInOrg = await createTestUser({ name: 'Search Org User' });
    colleague = await createTestUser({ name: 'Search Colleague UniqueNameXyz' });
    outsider = await createTestUser({ name: 'Search Outsider' });
    userIds.push(userInOrg.id, colleague.id, outsider.id);

    await prisma.businessMember.createMany({
      data: [
        {
          businessId: business.id,
          userId: userInOrg.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
          canManage: false,
        },
        {
          businessId: business.id,
          userId: colleague.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
          canManage: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.businessMember.deleteMany({
      where: { businessId: { in: businessIds } },
    });
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  it('does not return member hits for users outside shared tenant/connection', async () => {
    const q = colleague.email.slice(0, 8);
    const res = await request(app)
      .post('/api/search')
      .set(createAuthHeader(outsider))
      .send({
        query: q,
        filters: { moduleId: 'member' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const memberHits = (res.body.results as Array<{ moduleId: string; id: string }>).filter(
      (r) => r.moduleId === 'member'
    );
    expect(memberHits.some((h) => h.id === colleague.id)).toBe(false);
  });

  it('returns colleague in member results when sharing a business', async () => {
    const res = await request(app)
      .post('/api/search')
      .set(createAuthHeader(userInOrg))
      .send({
        query: 'UniqueNameXyz',
        filters: { moduleId: 'member' },
      });

    expect(res.status).toBe(200);
    const memberHits = (res.body.results as Array<{ moduleId: string; id: string }>).filter(
      (r) => r.moduleId === 'member'
    );
    expect(memberHits.some((h) => h.id === colleague.id)).toBe(true);
  });
});
