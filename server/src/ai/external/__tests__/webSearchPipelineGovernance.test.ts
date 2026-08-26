import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.hoisted(() => vi.fn());

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    businessAIDigitalTwin: {
      findUnique,
    },
  },
}));

vi.mock('../webSearchAdapter', async () => {
  const actual = await vi.importActual<typeof import('../webSearchAdapter')>('../webSearchAdapter');
  return {
    ...actual,
    executeWebSearch: vi.fn(),
  };
});

import { executeWebSearch } from '../webSearchAdapter';
import { runWebSearchForPipeline } from '../webSearchPipelineService';

describe('webSearchPipelineService governance', () => {
  beforeEach(() => {
    findUnique.mockReset();
    vi.mocked(executeWebSearch).mockReset();
  });

  it('never calls Tavily when externalAPIAccess is false', async () => {
    findUnique.mockResolvedValue({
      restrictions: { externalAPIAccess: false },
      status: 'active',
      allowEmployeeInteraction: true,
    });

    const out = await runWebSearchForPipeline({
      userId: 'u1',
      businessId: 'b1',
      userMessage: 'What are mortgage rates today?',
    });

    expect(out.result.success).toBe(false);
    expect(out.result.failureCode).toBe('policy_denied');
    expect(executeWebSearch).not.toHaveBeenCalled();
  });

  it('calls Tavily when business allows external APIs', async () => {
    findUnique.mockResolvedValue({
      restrictions: { externalAPIAccess: true },
      status: 'active',
      allowEmployeeInteraction: true,
    });
    vi.mocked(executeWebSearch).mockResolvedValue({
      capabilityId: 'web_search',
      providerId: 'tavily',
      success: true,
      retrievedAt: new Date().toISOString(),
      evidence: [
        {
          capabilityId: 'web_search',
          provider: 'tavily',
          sourceKind: 'web',
          title: 'Rates',
          url: 'https://example.com/r',
          detail: '6.4%',
          retrievedAt: new Date().toISOString(),
          rank: 1,
          domain: 'example.com',
        },
      ],
    });

    const out = await runWebSearchForPipeline({
      userId: 'u1',
      businessId: 'b1',
      userMessage: 'What are mortgage rates today?',
    });

    expect(out.result.success).toBe(true);
    expect(executeWebSearch).toHaveBeenCalledTimes(1);
    const req = vi.mocked(executeWebSearch).mock.calls[0]?.[0];
    expect(req?.egressQuery).toBeTruthy();
    expect(JSON.stringify(req)).not.toContain('assembled');
    expect(JSON.stringify(req)).not.toContain('UserMemoryFact');
  });

  it('policy-denies unsafe egress with zero Tavily calls', async () => {
    findUnique.mockResolvedValue(null);
    const out = await runWebSearchForPipeline({
      userId: 'u1',
      userMessage: 'lookup 123-45-6789 employee record',
    });
    expect(out.result.failureCode).toBe('policy_denied');
    expect(executeWebSearch).not.toHaveBeenCalled();
  });
});
