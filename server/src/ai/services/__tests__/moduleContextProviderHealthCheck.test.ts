import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { prisma } from '../../../lib/prisma';
import { runModuleContextProviderHealthCheck } from '../moduleContextProviderHealthCheck';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('moduleContextProviderHealthCheck', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret-with-enough-length-32';
  });

  it('marks provider healthy when probe succeeds with canonical shape', async () => {
    vi.spyOn(prisma.moduleInstallation, 'findMany').mockResolvedValue([
      { moduleId: 'drive' },
    ] as never);
    vi.spyOn(prisma.moduleAIContextRegistry, 'findMany').mockResolvedValue([
      {
        moduleId: 'drive',
        module: { name: 'File Hub' },
        contextProviders: [
          {
            name: 'recent_files',
            endpoint: '/api/drive/ai/context/recent',
            cacheDuration: 900_000,
          },
        ],
      },
    ] as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      email: 'user@test.com',
      role: 'USER',
    } as never);
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        success: true,
        context: { recentFiles: [] },
        metadata: { provider: 'drive', endpoint: 'recent', timestamp: new Date().toISOString() },
      },
    });

    const report = await runModuleContextProviderHealthCheck({ userId: 'user-1' });

    expect(report.summary.healthy).toBe(1);
    expect(report.results[0]?.status).toBe('healthy');
  });

  it('skips business-scoped modules without businessId', async () => {
    vi.spyOn(prisma.moduleInstallation, 'findMany').mockResolvedValue([
      { moduleId: 'hr' },
    ] as never);
    vi.spyOn(prisma.moduleAIContextRegistry, 'findMany').mockResolvedValue([
      {
        moduleId: 'hr',
        module: { name: 'HR' },
        contextProviders: [
          {
            name: 'hr_overview',
            endpoint: '/api/hr/ai/context/overview',
            cacheDuration: 900_000,
          },
        ],
      },
    ] as never);

    const report = await runModuleContextProviderHealthCheck({ userId: 'user-1' });

    expect(report.summary.skipped).toBe(1);
    expect(report.results[0]?.skipReason).toContain('businessId');
  });

  it('classifies timeout failures as unhealthy', async () => {
    vi.spyOn(prisma.moduleInstallation, 'findMany').mockResolvedValue([
      { moduleId: 'drive' },
    ] as never);
    vi.spyOn(prisma.moduleAIContextRegistry, 'findMany').mockResolvedValue([
      {
        moduleId: 'drive',
        module: { name: 'File Hub' },
        contextProviders: [
          {
            name: 'recent_files',
            endpoint: '/api/drive/ai/context/recent',
            cacheDuration: 900_000,
          },
        ],
      },
    ] as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      email: 'user@test.com',
      role: 'USER',
    } as never);
    vi.mocked(axios.get).mockRejectedValue({ code: 'ECONNABORTED' });

    const report = await runModuleContextProviderHealthCheck({ userId: 'user-1' });

    expect(report.summary.unhealthy).toBe(1);
    expect(report.results[0]?.failureReason).toBe('timeout');
  });
});
