import { describe, it, expect, vi, afterEach } from 'vitest';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

describe('authorize (policyEngine)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dashboard:read allows owner with matching tenant scope', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      businessId: 'b1',
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1', businessId: 'b1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('dashboard_owner');
  });

  it('dashboard:read denies TENANT_MISMATCH when scope businessId disagrees', async () => {
    const warn = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      businessId: 'b1',
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1', businessId: 'b_wrong' },
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('TENANT_MISMATCH');
    expect(warn).toHaveBeenCalledWith(
      'Policy denied',
      expect.objectContaining({
        operation: 'policy_deny',
        reason: 'TENANT_MISMATCH',
        action: POLICY_ACTIONS.DASHBOARD_READ,
      }),
    );
  });

  it('dashboard:read defers cross-user access to handler (allow, delegate_owner_scope)', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u_owner',
      businessId: null,
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u_intruder',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('delegate_owner_scope');
  });

  it('fails closed with POLICY_NOT_IMPLEMENTED for unimplemented actions', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.BUSINESS_UPDATE,
      resourceType: 'business',
      resourceId: 'b1',
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('POLICY_NOT_IMPLEMENTED');
  });

  it('file:read on folder allows owner', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u1',
      dashboardId: 'd1',
      trashedAt: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
      scope: { dashboardId: 'd1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('folder_owner');
  });

  it('file:read denies TENANT_MISMATCH when scope dashboardId disagrees with folder', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u1',
      dashboardId: 'd1',
      trashedAt: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
      scope: { dashboardId: 'd_other' },
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('TENANT_MISMATCH');
  });

  it('file:read denies with INSUFFICIENT_ROLE when not owner and no read grant', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u_owner',
      dashboardId: null,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue(null);

    const d = await authorize({
      userId: 'u_other',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('file:read allows collaborator with canRead grant', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u_owner',
      dashboardId: null,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue({ id: 'p1' } as never);

    const d = await authorize({
      userId: 'u_reader',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('folder_permission_read');
  });
});
