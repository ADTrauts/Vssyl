import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import {
  beginImpersonation,
  createImpersonationSession,
  endActiveImpersonation,
  findActiveImpersonation,
  ImpersonationAlreadyActiveError,
  ImpersonationBusinessMembershipError,
  NoActiveImpersonationError,
} from '../admin/adminImpersonationService';

describe('adminImpersonationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('beginImpersonation returns denied result and audits denial', async () => {
    vi.spyOn(adminAuditService, 'logImpersonationDeniedAudit').mockResolvedValue(undefined);

    const result = await beginImpersonation({
      adminUser: { id: 'admin-1', email: 'admin@test.com' },
      targetUserId: 'admin-1',
    });

    expect(result).toMatchObject({
      kind: 'denied',
      statusCode: 403,
      error: 'Cannot impersonate your own account',
      reason: 'self',
    });
    expect(adminAuditService.logImpersonationDeniedAudit).toHaveBeenCalled();
  });

  it('beginImpersonation throws when admin already has active session', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-2',
      email: 'user@test.com',
      name: 'User',
      role: 'USER',
      emailVerified: new Date(),
    } as never);
    vi.spyOn(prisma.adminImpersonation, 'findFirst').mockResolvedValue({ id: 'existing' } as never);

    await expect(
      beginImpersonation({
        adminUser: { id: 'admin-1' },
        targetUserId: 'user-2',
      }),
    ).rejects.toBeInstanceOf(ImpersonationAlreadyActiveError);
  });

  it('beginImpersonation starts session, audits, and returns token', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-2',
      email: 'user@test.com',
      name: 'User',
      role: 'USER',
      emailVerified: new Date(),
    } as never);
    vi.spyOn(prisma.adminImpersonation, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.adminImpersonation, 'create').mockResolvedValue({
      id: 'imp-1',
      startedAt: new Date('2026-06-16T10:00:00Z'),
      reason: 'support',
      businessId: null,
      context: null,
    } as never);
    vi.spyOn(adminAuditService, 'logImpersonationStartAudit').mockResolvedValue(undefined);

    const result = await beginImpersonation({
      adminUser: { id: 'admin-1', email: 'admin@test.com' },
      targetUserId: 'user-2',
      reason: 'support',
      expiresInMinutes: 30,
    });

    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.message).toBe('Impersonation started successfully');
      expect(result.impersonation.id).toBe('imp-1');
      expect(result.token).toEqual(expect.any(String));
      expect(result.token.length).toBeGreaterThan(0);
    }
    expect(adminAuditService.logImpersonationStartAudit).toHaveBeenCalled();
  });

  it('createImpersonationSession rejects missing business membership', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(null);

    await expect(
      createImpersonationSession({
        adminId: 'admin-1',
        targetUserId: 'user-2',
        businessId: 'biz-1',
      }),
    ).rejects.toBeInstanceOf(ImpersonationBusinessMembershipError);
  });

  it('endActiveImpersonation throws when no active session', async () => {
    vi.spyOn(prisma.adminImpersonation, 'findFirst').mockResolvedValue(null);

    await expect(
      endActiveImpersonation({ adminUser: { id: 'admin-1' } }),
    ).rejects.toBeInstanceOf(NoActiveImpersonationError);
  });

  it('endActiveImpersonation ends session and audits', async () => {
    const startedAt = new Date(Date.now() - 120_000);
    vi.spyOn(prisma.adminImpersonation, 'findFirst').mockResolvedValue({
      id: 'imp-1',
      targetUserId: 'user-2',
      startedAt,
      targetUser: { id: 'user-2', email: 'user@test.com', name: 'User' },
      business: null,
    } as never);
    vi.spyOn(prisma.adminImpersonation, 'update').mockResolvedValue({} as never);
    vi.spyOn(adminAuditService, 'logImpersonationEndAudit').mockResolvedValue(undefined);

    const result = await endActiveImpersonation({
      adminUser: { id: 'admin-1', email: 'admin@test.com' },
    });

    expect(result.message).toBe('Impersonation ended successfully');
    expect(result.impersonation.id).toBe('imp-1');
    expect(prisma.adminImpersonation.update).toHaveBeenCalled();
    expect(adminAuditService.logImpersonationEndAudit).toHaveBeenCalled();
  });

  it('findActiveImpersonation scopes to open sessions', async () => {
    vi.spyOn(prisma.adminImpersonation, 'findFirst').mockResolvedValue(null);

    await findActiveImpersonation('admin-1');

    expect(prisma.adminImpersonation.findFirst).toHaveBeenCalledWith({
      where: { adminId: 'admin-1', endedAt: null },
    });
  });
});
