import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    moduleInstallation: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../../lib/prisma';
import { buildSkimUserContext } from '../lazyUserContext';

describe('lazyUserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns skim context without cross-module insights or patterns', async () => {
    vi.mocked(prisma.moduleInstallation.findMany).mockResolvedValue([
      { moduleId: 'drive' },
      { moduleId: 'calendar' },
    ] as never);

    const ctx = await buildSkimUserContext('user-1');

    expect(ctx.userId).toBe('user-1');
    expect(ctx.activeModules).toEqual(['drive', 'calendar']);
    expect(ctx.crossModuleInsights).toEqual([]);
    expect(ctx.patterns).toEqual([]);
    expect(ctx.relationships).toEqual([]);
  });

  it('falls back to dashboard when no installations', async () => {
    vi.mocked(prisma.moduleInstallation.findMany).mockResolvedValue([] as never);

    const ctx = await buildSkimUserContext('user-2');
    expect(ctx.activeModules).toEqual(['dashboard']);
  });
});
