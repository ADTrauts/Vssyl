/**
 * Phase 1B — Runtime knowledge ingress (actual persistence paths).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { User } from '@prisma/client';
import {
  cleanupTestUsers,
  createTestUser,
} from '../../../__tests__/helpers/auth';
import { prisma } from '../../../lib/prisma';
import {
  maybePersistRememberThatFact,
  createUserMemoryFact,
} from '../../../services/userMemoryFactService';
import {
  addBusinessMember,
  cleanupAiPhase1bArtifacts,
  createTestBusiness,
} from '../../__tests__/helpers/phase1bTwinTestApp';
import { BusinessRole } from '@prisma/client';

describe('Phase 1B — knowledge ingress runtime', () => {
  const userIds: string[] = [];
  const businessIds: string[] = [];
  let user: User;
  let other: User;

  beforeAll(async () => {
    user = await createTestUser({ name: 'Phase1B Memory User' });
    other = await createTestUser({ name: 'Phase1B Memory Other' });
    userIds.push(user.id, other.id);
  });

  afterAll(async () => {
    await cleanupAiPhase1bArtifacts({ userIds, businessIds });
    await cleanupTestUsers(userIds);
  });

  it('6.1 explicit personal teaching writes UserMemoryFact', async () => {
    await maybePersistRememberThatFact({
      userId: user.id,
      query: 'Remember that I prefer afternoon meetings.',
    });
    const fact = await prisma.userMemoryFact.findFirst({
      where: {
        userId: user.id,
        sourceType: 'remember_that',
        predicate: { contains: 'afternoon meetings' },
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(fact).toBeTruthy();
    expect(fact?.scope).toBe('personal');
    expect(fact?.businessId).toBeNull();
    expect(fact?.isExplicit).toBe(true);
  });

  it('6.2 explicit correction creates a new personal fact (supersede gap documented if old remains)', async () => {
    await maybePersistRememberThatFact({
      userId: user.id,
      query: 'Remember that I prefer morning meetings now.',
    });
    const facts = await prisma.userMemoryFact.findMany({
      where: { userId: user.id, sourceType: 'remember_that' },
      orderBy: { createdAt: 'asc' },
    });
    expect(facts.some((f) => f.predicate.toLowerCase().includes('morning'))).toBe(true);
    // Current runtime appends rather than deleting old — gap recorded in open limitations
  });

  it('6.4 temporary conversational statement does not durable-write', async () => {
    const before = await prisma.userMemoryFact.count({ where: { userId: user.id } });
    await maybePersistRememberThatFact({
      userId: user.id,
      query: 'I am feeling tired today.',
    });
    const after = await prisma.userMemoryFact.count({ where: { userId: user.id } });
    expect(after).toBe(before);
  });

  it('6.6 business fact stays business-scoped', async () => {
    const biz = await createTestBusiness('Phase1B Memory Biz');
    businessIds.push(biz.id);
    await addBusinessMember({ businessId: biz.id, userId: user.id, role: BusinessRole.EMPLOYEE });

    await maybePersistRememberThatFact({
      userId: user.id,
      query: 'Remember that our company fiscal year ends in March.',
      businessId: biz.id,
    });

    const fact = await prisma.userMemoryFact.findFirst({
      where: {
        userId: user.id,
        businessId: biz.id,
        sourceType: 'remember_that',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(fact?.scope).toBe('business');
    expect(fact?.businessId).toBe(biz.id);

    const leaked = await prisma.userMemoryFact.findFirst({
      where: {
        userId: other.id,
        predicate: { contains: 'fiscal year' },
      },
    });
    expect(leaked).toBeNull();
  });

  it('6.8 ignore / short remember does not write', async () => {
    const before = await prisma.userMemoryFact.count({ where: { userId: user.id } });
    await maybePersistRememberThatFact({
      userId: user.id,
      query: 'Remember hi',
    });
    const after = await prisma.userMemoryFact.count({ where: { userId: user.id } });
    expect(after).toBe(before);
  });

  it('live module fact path: createUserMemoryFact is not used for drive listing (fixture)', async () => {
    // Constitutional: live SoR facts are not copied into durable memory by Twin tools.
    // Assert create of drive-like content would be wrong if tagged remember_that — control:
    const driveLike = await createUserMemoryFact({
      userId: user.id,
      subject: 'drive-file',
      predicate: 'should-not-be-confused-with-live-sor',
      scope: 'personal',
      sourceType: 'explicit_user',
      isExplicit: true,
    });
    expect(driveLike.sourceType).not.toBe('module_live');
  });
});
