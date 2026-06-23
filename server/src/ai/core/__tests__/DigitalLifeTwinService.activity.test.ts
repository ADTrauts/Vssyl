import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DigitalLifeTwinService } from '../DigitalLifeTwinService';
import * as queryService from '../../../services/platform/platformActivityQueryService';

vi.mock('../../../services/platform/platformActivityQueryService', () => ({
  getFeedForUser: vi.fn(),
}));

vi.mock('../providers/OpenAIProvider', () => ({ OpenAIProvider: vi.fn() }));
vi.mock('../providers/AnthropicProvider', () => ({ AnthropicProvider: vi.fn() }));
vi.mock('../providers/LocalProvider', () => ({ LocalProvider: vi.fn() }));
vi.mock('../privacy/PrivacyDataRouter', () => ({ PrivacyDataRouter: vi.fn() }));
vi.mock('../core/PersonalityEngine', () => ({ PersonalityEngine: vi.fn() }));
vi.mock('../core/DecisionEngine', () => ({ DecisionEngine: vi.fn() }));
vi.mock('../core/LearningEngine', () => ({ LearningEngine: vi.fn() }));
vi.mock('../core/ActionExecutor', () => ({ ActionExecutor: vi.fn() }));
vi.mock('../context/CrossModuleContextEngine', () => ({ CrossModuleContextEngine: vi.fn() }));
vi.mock('../core/DigitalLifeTwinCore', () => ({ DigitalLifeTwinCore: vi.fn() }));

describe('DigitalLifeTwinService activity reads (ACT-R1 P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads recent activity via platformActivityQueryService', async () => {
    vi.mocked(queryService.getFeedForUser).mockResolvedValue([
      {
        logId: 'log-1',
        eventId: 'evt-1',
        timestamp: new Date('2026-06-22T12:00:00.000Z'),
        moduleId: 'chat',
        action: 'message',
        targetType: 'message',
        targetId: 'm-1',
        metadata: {},
        actorUserId: 'u1',
      },
    ]);

    const service = new DigitalLifeTwinService({} as never);
    const recent = await (
      service as unknown as { getRecentActivity: (id: string) => Promise<unknown[]> }
    ).getRecentActivity('u1');

    expect(queryService.getFeedForUser).toHaveBeenCalledWith({
      userId: 'u1',
      limit: 50,
    });
    expect(recent).toEqual([
      expect.objectContaining({
        id: 'log-1',
        type: 'chat_message',
      }),
    ]);
  });
});
