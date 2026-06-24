import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { installModule } from '../../controllers/module/moduleProvisionController';
import * as domainEventEmitters from '../domainEventEmitters';
import * as moduleInstallPolicyDual from '../../auth/moduleInstallPolicyDual';

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('installModule domain event emission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(domainEventEmitters, 'emitModuleInstalledEvent').mockImplementation(() => ({
      id: 'evt_test',
      type: 'module.installed',
      actorUserId: 'u1',
      entityType: 'ModuleInstallation',
      entityId: 'inst_1',
      action: 'install',
      metadata: {},
      createdAt: new Date().toISOString(),
    }));
  });

  it('does not emit when user is unauthorized', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleInstalledEvent');
    const req = { params: { moduleId: 'scheduling' } } as unknown as Request;
    const res = mockResponse();

    await installModule(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit when policy dual blocks install', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleInstalledEvent');
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'todo',
      status: 'APPROVED',
      pricingTier: 'free',
      manifest: { moduleScope: 'both', supportedContexts: ['personal', 'business'] },
    } as never);
    vi.spyOn(moduleInstallPolicyDual, 'evaluateModuleInstallPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'policy_denied',
    });

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'todo' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await installModule(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits module.installed after successful personal install', async () => {
    const emitSpy = vi.spyOn(domainEventEmitters, 'emitModuleInstalledEvent');
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'todo',
      status: 'APPROVED',
      pricingTier: 'free',
      manifest: { moduleScope: 'both', supportedContexts: ['personal', 'business'] },
    } as never);
    vi.spyOn(moduleInstallPolicyDual, 'evaluateModuleInstallPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.moduleInstallation, 'create').mockResolvedValue({
      id: 'inst_personal_1',
      moduleId: 'todo',
      userId: 'u1',
      enabled: true,
      installedAt: new Date(),
      configured: null,
      module: {
        id: 'todo',
        name: 'Todo',
        description: '',
        version: '1',
        category: 'PRODUCTIVITY',
        developer: { id: 'dev1', name: 'Vssyl', email: 'dev@vssyl.com' },
        pricingTier: 'free',
        basePrice: null,
        enterprisePrice: null,
      },
    } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({} as never);

    const req = {
      user: { id: 'u1', role: 'USER' },
      params: { moduleId: 'todo' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await installModule(req, res);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        moduleId: 'todo',
        installationId: 'inst_personal_1',
        installScope: 'personal',
      })
    );
    const emitArg = emitSpy.mock.calls[0]?.[0];
    expect(emitArg).toBeDefined();
    expect(emitArg).not.toHaveProperty('configuration');
  });
});
