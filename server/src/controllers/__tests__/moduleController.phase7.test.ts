import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { zipSync } from 'fflate';
import { prisma } from '../../lib/prisma';
import { storageService } from '../../services/storageService';
import {
  finalizeModuleArtifactUpload,
  getMarketplaceModules,
  getModuleDetails,
  getModuleRuntimeConfig,
  linkModuleToBusiness,
  promoteModuleVersion,
  reviewModuleSubmission,
} from '../moduleController';

vi.mock('../../services/ModuleRegistrySyncService.js', () => ({
  moduleRegistrySyncService: { syncModule: vi.fn().mockResolvedValue(undefined) },
}));

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

  it('does not mark submission reviewed when certification validation fails', async () => {
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as any);
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue({
      id: 'sub-1',
      moduleId: 'm1',
      status: 'PENDING',
      module: {
        id: 'invalid',
        version: '1.0.0',
        name: 'Invalid Cert Module',
        manifest: { permissions: [] },
        permissions: [],
      },
    } as any);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue({
      id: 'mv-1',
      moduleId: 'invalid',
      version: '1.0.0',
      manifestSnapshot: { permissions: [] },
    } as any);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({
      scanStatus: 'PASSED',
    } as any);
    const updateSpy = vi.spyOn(prisma.moduleSubmission, 'update');

    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      params: { submissionId: 'sub-1' },
      body: { action: 'approve', reviewNotes: 'looks good' },
    } as unknown as Request;
    const res = mockResponse();

    await reviewModuleSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        details: expect.objectContaining({
          certification: expect.objectContaining({ status: 'failed' }),
        }),
      })
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('does not mark submission reviewed when approval guard fails artifact scan', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue({
      id: 'sub-1',
      moduleId: 'm1',
      status: 'PENDING',
      module: { id: 'm1', version: '1.0.0', name: 'Guard Test Module' },
    } as any);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue({
      id: 'mv-1',
      moduleId: 'm1',
      version: '1.0.0',
    } as any);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({
      scanStatus: 'FAILED',
    } as any);
    const updateSpy = vi.spyOn(prisma.moduleSubmission, 'update');

    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      params: { submissionId: 'sub-1' },
      body: { action: 'approve', reviewNotes: 'looks good' },
    } as unknown as Request;
    const res = mockResponse();

    await reviewModuleSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Module artifact scan must pass before approval',
      })
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('finalize upload allows zip without html when manifest has https entryUrl', async () => {
    const zipWithoutHtml = Buffer.from(
      zipSync({
        'bundle.js': new TextEncoder().encode('console.log("hello");'),
        'readme.txt': new TextEncoder().encode('bundle files'),
      })
    );

    vi.spyOn(prisma.moduleUploadSession, 'findUnique').mockResolvedValue({
      id: 'us-1',
      moduleId: 'm1',
      uploaderId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
      objectPath: 'modules/m1/1.0.0/bundle.zip',
      bucket: 'bucket-1',
    } as any);
    vi.spyOn(storageService, 'fileExists').mockResolvedValue(true);
    vi.spyOn(storageService, 'getFileBuffer').mockResolvedValue(zipWithoutHtml);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({
      id: 'm1',
      name: 'Hosted Module',
      version: '1.0.0',
    } as any);
    vi.spyOn(prisma.moduleVersion, 'upsert').mockResolvedValue({
      id: 'mv-1',
    } as any);
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as any);
    vi.spyOn(prisma.moduleArtifact, 'upsert').mockResolvedValue({
      id: 'artifact-1',
      scanStatus: 'PASSED',
    } as any);
    vi.spyOn(prisma.moduleUploadSession, 'update').mockResolvedValue({ id: 'us-1' } as any);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'm1', uploadSessionId: 'us-1' },
      body: {
        version: '1.0.0',
        manifest: {
          frontend: { entryUrl: 'https://cdn.example.com/module/index.html' },
        },
        permissions: [],
        dependencies: [],
      },
    } as unknown as Request;
    const res = mockResponse();

    await finalizeModuleArtifactUpload(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          scanStatus: 'PASSED',
        }),
      })
    );
  });

  const moduleDetailBase = {
    id: 'm1',
    name: 'M',
    description: 'd',
    version: '1',
    category: 'PRODUCTIVITY',
    tags: [],
    icon: null,
    screenshots: [],
    manifest: {},
    dependencies: [],
    permissions: [],
    rating: 0,
    reviewCount: 0,
    downloads: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    installations: [],
    moduleReviews: [],
  };

  it('getModuleDetails returns 404 for non-approved module when caller is not developer or admin', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      ...moduleDetailBase,
      status: 'PENDING',
      developerId: 'other-dev',
      developer: { name: 'X', email: 'x@y.com' },
    } as any);

    const req = { user: { id: 'u1', role: 'USER' }, params: { moduleId: 'm1' } } as unknown as Request;
    const res = mockResponse();
    await getModuleDetails(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getModuleDetails allows developer to read their own non-approved module', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      ...moduleDetailBase,
      status: 'DRAFT',
      developerId: 'u1',
      developer: { name: 'Me', email: 'me@y.com' },
    } as any);

    const req = { user: { id: 'u1', role: 'USER' }, params: { moduleId: 'm1' } } as unknown as Request;
    const res = mockResponse();
    await getModuleDetails(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

