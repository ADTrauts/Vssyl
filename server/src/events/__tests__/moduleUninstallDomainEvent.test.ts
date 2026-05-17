import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { uninstallModule } from '../../controllers/module/moduleProvisionController';
import * as domainEventEmitters from '../domainEventEmitters';
import * as moduleUninstallPolicyDual from '../../auth/moduleUninstallPolicyDual';

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('uninstallModule domain event emission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent').mockImplementation(() => ({
      id: 'evt_test',
      type: 'module.uninstalled',
      actorUserId: 'u1',
      entityType: 'ModuleInstallation',
      entityId: 'inst_1',
      action: 'uninstall',
      metadata: {},
      createdAt: new Date().toISOString(),
    }));
  });

  it('does not emit when user is unauthorized', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent');
    const req = { params: { moduleId: 'scheduling' } } as unknown as Request;
    const res = mockResponse();

    await uninstallModule(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit when policy dual blocks uninstall', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent');
    vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue({
      id: 'inst_1',
      moduleId: 'scheduling',
      userId: 'u1',
    } as never);
    vi.spyOn(moduleUninstallPolicyDual, 'evaluateModuleUninstallPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'scheduling' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await uninstallModule(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit when module is not installed (personal)', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent');
    vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue(null);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'scheduling' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await uninstallModule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns 404 and does not emit when business installation is missing', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent');
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      role: 'ADMIN',
      canManage: false,
      businessId: 'b1',
    } as never);
    vi.spyOn(moduleUninstallPolicyDual, 'evaluateModuleUninstallPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue(null);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'scheduling' },
      query: { scope: 'business', businessId: 'b1' },
    } as unknown as Request;
    const res = mockResponse();

    await uninstallModule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits module.uninstalled after successful personal uninstall', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleUninstalledEvent');
    vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue({
      id: 'inst_personal_1',
      moduleId: 'scheduling',
      userId: 'u1',
    } as never);
    vi.spyOn(moduleUninstallPolicyDual, 'evaluateModuleUninstallPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(prisma.moduleInstallation, 'delete').mockResolvedValue({} as never);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'scheduling' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await uninstallModule(req, res);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        moduleId: 'scheduling',
        installationId: 'inst_personal_1',
        installScope: 'personal',
      })
    );
  });
});
