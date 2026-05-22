import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import { synthesizeCrossModuleContext } from '../ContextSynthesisService';
import { linkEntitiesAcrossModules } from '../entityLinking';
import { isSyntheticContextEnabled } from '../syntheticContextPolicy';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: ['chat', 'calendar', 'drive'],
  crossModuleInsights: [
    {
      id: 'work_life_balance_trend',
      synthetic: true,
      type: 'trend',
      title: 'Work-Life Balance Improving',
      description: 'Demo insight',
      modules: ['business'],
      confidence: 0.8,
      priority: 'medium',
      actionable: true,
      suggestedActions: [],
      dataPoints: [],
      timestamp: new Date(),
    },
  ],
  currentFocus: { module: 'calendar', activity: 'meetings', priority: 'medium', timeSpent: 0 },
  patterns: [],
  relationships: [],
  preferences: {
    communication: {
      preferredChannels: [],
      responseTimeExpectations: {},
      formalityLevel: 0.5,
      timezone: 'UTC',
    },
    work: {
      productiveHours: [],
      focusBlockPreference: 60,
      interruptionTolerance: 0.5,
      collaborationStyle: 'balanced',
      prioritizationMethod: 'priority',
    },
    personal: {
      socialEngagement: 0.5,
      privacyLevel: 0.5,
      sharingComfort: 0.5,
      planningHorizon: 7,
    },
  },
  lifeState: {
    workLifeBalance: { score: 50, trend: 'stable', concerns: [], opportunities: [] },
    productivity: { score: 50, peakHours: [], efficiency: 0.5, bottlenecks: [] },
    relationships: { score: 50, socialConnections: 0, communicationHealth: 0.5, networkGrowth: 0 },
    goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
  },
};

const fixtureModuleContexts = {
  chat: {
    moduleName: 'Chat',
    providerName: 'recent_conversations',
    relevance: 'high',
    data: {
      success: true,
      context: {
        recentConversations: [
          {
            id: 'conv-1',
            name: 'Project sync',
            participants: [
              { id: 'user-alex', name: 'Alex Chen', email: 'alex@example.com' },
            ],
            attachments: [{ fileId: 'file-abc', name: 'Q2-plan.pdf' }],
          },
        ],
        summary: { totalActiveConversations: 1 },
      },
    },
  },
  calendar: {
    moduleName: 'Calendar',
    providerName: 'upcoming_events',
    relevance: 'high',
    data: {
      success: true,
      context: {
        upcomingEvents: [
          {
            id: 'evt-1',
            title: 'Project sync',
            startTime: '2026-05-22T15:00:00.000Z',
            attendees: [{ id: 'user-alex', name: 'Alex Chen', email: 'alex@example.com' }],
          },
        ],
        summary: { totalUpcomingEvents: 1, nextEventTitle: 'Project sync' },
      },
    },
  },
  drive: {
    moduleName: 'Drive',
    providerName: 'recent_files',
    relevance: 'medium',
    data: {
      success: true,
      context: {
        recentFiles: [{ id: 'file-abc', name: 'Q2-plan.pdf' }],
        summary: { totalRecentFiles: 1 },
      },
    },
  },
};

describe('context synthesis integration (Phase 3C)', () => {
  it('links people and files across chat, calendar, and drive fixtures', () => {
    const entityLinks = linkEntitiesAcrossModules({
      moduleContexts: fixtureModuleContexts,
      query: 'meeting tomorrow and files we shared with Alex',
    });

    expect(entityLinks.linkedPeople).toHaveLength(1);
    expect(entityLinks.linkedPeople[0]?.name).toBe('Alex Chen');
    expect(entityLinks.linkedFiles).toHaveLength(1);
    expect(entityLinks.linkedFiles[0]?.fileId).toBe('file-abc');
  });

  it('produces a data-backed synthesis block with linked entities', () => {
    const entityLinks = linkEntitiesAcrossModules({ moduleContexts: fixtureModuleContexts });
    const synthesis = synthesizeCrossModuleContext({
      query: 'meeting tomorrow and files we shared',
      moduleContexts: fixtureModuleContexts,
      entityLinks,
    });

    expect(synthesis.dataBacked).toBe(true);
    expect(synthesis.modulesIncluded).toEqual(expect.arrayContaining(['chat', 'calendar', 'drive']));
    expect(synthesis.bulletPoints.some((b) => b.includes('Alex Chen'))).toBe(true);
    expect(synthesis.bulletPoints.some((b) => b.includes('Q2-plan.pdf'))).toBe(true);

    const assembled = assembleAIContext({
      query: { query: 'meeting tomorrow and files we shared', userId: 'u1', context: {} },
      userContext: baseUserContext,
      moduleContexts: fixtureModuleContexts,
      crossModuleSynthesis: synthesis,
    });

    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles).toContain('Cross-module summary');
    expect(titles.filter((t) => t.startsWith('Module live context'))).toHaveLength(3);
    expect(assembled.scope).toBe('cross_module');
  });

  it('excludes synthetic cross-module insights unless dev flag is enabled', () => {
    const prev = process.env.AI_SYNTHETIC_CONTEXT_ENABLED;
    process.env.AI_SYNTHETIC_CONTEXT_ENABLED = 'false';

    const assembled = assembleAIContext({
      query: { query: 'how is my productivity', userId: 'u1', context: {} },
      userContext: baseUserContext,
      moduleContexts: fixtureModuleContexts,
    });

    expect(isSyntheticContextEnabled()).toBe(false);
    expect(assembled.contextBlocks.some((b) => b.title === 'Cross-module insights')).toBe(false);

    process.env.AI_SYNTHETIC_CONTEXT_ENABLED = prev;
  });
});
