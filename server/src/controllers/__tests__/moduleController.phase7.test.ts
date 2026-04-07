import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import {
  getMarketplaceModules,
  getModuleRuntimeConfig,
  linkModuleToBusiness,
  promoteModuleVersion,
} from '../moduleController';

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('moduleController Phase 7 critical paths', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('denies module-to-business linking when user is not active business member', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'm1',
      name: 'Test Module',
      developerId: 'u1',
      businessId: null,
    } as any);
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

    const req = {
      user: { id: 'u1', role: 'USER' },
      body: { moduleId: 'm1', businessId: 'b1' },
    } as unknown as Request;
    const res = mockResponse();

    await linkModuleToBusiness(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Access denied for this business' })
    );
  });

  it('marks developer business on idempotent link when designation is missing', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'm1',
      name: 'Test Module',
      developerId: 'u1',
      businessId: 'b1',
    } as any);
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      business: { id: 'b1', name: 'Acme Corp' },
    } as any);
    vi.spyOn((prisma as any).business, 'findUnique').mockResolvedValue({ isDeveloperBusiness: false });
    const businessUpdateSpy = vi.spyOn((prisma as any).business, 'update').mockResolvedValue({ id: 'b1' });
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-1' } as any);

    const req = {
      user: { id: 'u1', role: 'USER' },
      body: { moduleId: 'm1', businessId: 'b1' },
    } as unknown as Request;
    const res = mockResponse();

    await linkModuleToBusiness(req, res);

    expect(businessUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b1' },
        data: expect.objectContaining({ isDeveloperBusiness: true, developerBusinessLinkedBy: 'u1' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: 'Module is already linked to this business',
        }),
      })
    );
  });

  it('allows business runtime when business subscription is active', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      id: 'member-1',
      businessId: 'b1',
      userId: 'u1',
      isActive: true,
    } as any);
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'm1',
      name: 'Paid Module',
      version: '1.0.0',
      status: 'APPROVED',
      pricingTier: 'premium',
      manifest: { frontend: { entryUrl: 'https://modules.example.com/entry.html' } },
      permissions: ['files:read'],
      installations: [],
      businessInstallations: [{ id: 'install-1' }],
      businessSubscriptions: [{ id: 'biz-sub-1', status: 'active' }],
      subscriptions: [],
    } as any);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(null);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'm1' },
      query: { scope: 'business', businessId: 'b1' },
    } as unknown as Request;
    const res = mockResponse();

    await getModuleRuntimeConfig(req, res);

    expect(res.status).not.toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'm1',
          accessContext: expect.objectContaining({ scope: 'business', businessId: 'b1' }),
        }),
      })
    );
  });

  it('blocks promotion when target artifact scan is not passed', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'm1',
      name: 'Promotable Module',
      version: '2.0.0',
    } as any);
    vi.spyOn(prisma.moduleVersion, 'findUnique').mockResolvedValue({
      id: 'mv1',
      version: '1.9.0',
      isCurrent: false,
    } as any);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({
      scanStatus: 'FAILED',
    } as any);

    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      params: { moduleId: 'm1', version: '1.9.0' },
    } as unknown as Request;
    const res = mockResponse();

    await promoteModuleVersion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Target version artifact scan must pass before promotion',
      })
    );
  });

  it('queries marketplace with APPROVED-only filter', async () => {
    const findManySpy = vi.spyOn(prisma.module, 'findMany').mockResolvedValue([]);

    const req = {
      user: { id: 'u1', role: 'USER' },
      query: { scope: 'personal' },
    } as unknown as Request;
    const res = mockResponse();

    await getMarketplaceModules(req, res);

    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'APPROVED' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [] }));
  });
});

