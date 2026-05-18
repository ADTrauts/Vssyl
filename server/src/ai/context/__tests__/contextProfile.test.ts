import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';
import { applyContextProfile } from '../contextProfile';

const VACATION_PROMPT =
  'I want to go on a last minute vacation. Where are the best, and most affordable places?';

function mockUserContext(): UserContext {
  return {
    userId: 'user-1',
    timestamp: new Date(),
    activeModules: ['dashboard', 'drive'],
    currentFocus: { activity: 'Planning', priority: 'medium', module: 'dashboard', timeSpent: 0 },
    patterns: [{ id: 'p1', type: 'behavioral', pattern: 'Morning email check', frequency: 5, modules: ['chat'], confidence: 0.7, impact: 'neutral', trends: { direction: 'stable', strength: 0.5 } }],
    crossModuleInsights: [
      {
        id: 'work_life_balance_trend',
        synthetic: true,
        type: 'trend',
        title: 'Work-Life Balance Improving',
        description: 'Balanced time between work and personal activities',
        modules: ['business'],
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        suggestedActions: [],
        dataPoints: [],
        timestamp: new Date(),
      },
    ],
    relationships: [],
    preferences: {} as UserContext['preferences'],
    lifeState: {
      workLifeBalance: { score: 72, trend: 'improving', concerns: [], opportunities: [] },
      productivity: { score: 81, peakHours: [], efficiency: 0, bottlenecks: [] },
      relationships: { score: 65, socialConnections: 0, communicationHealth: 0, networkGrowth: 0 },
      goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
    },
  };
}

describe('context profile — conversation', () => {
  it('assembles vacation prompt with conversation mode and excludes analytics blocks', () => {
    const assembled = assembleAIContext({
      query: {
        query: VACATION_PROMPT,
        userId: 'user-1',
        context: { currentModule: 'dashboard' },
      },
      userContext: mockUserContext(),
      toneMode: 'conversational',
    });

    expect(assembled.structuredResponseMode).toBe('conversation');

    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles).not.toContain('Cross-module insights');
    expect(titles).not.toContain('Observed patterns');
    expect(titles).not.toContain('Smart pattern analysis');
    expect(titles).not.toContain('Collective learning patterns');

    const serialized = JSON.stringify(assembled.contextBlocks);
    expect(serialized).not.toMatch(/Work-Life Balance/i);
    expect(serialized).not.toMatch(/Productivity Score/i);
  });

  it('enterprise analytics prompt keeps richer context blocks', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Analyze our Q1 metrics and break down churn drivers for the dashboard',
        userId: 'user-1',
        context: { currentModule: 'business' },
      },
      userContext: mockUserContext(),
    });

    expect(assembled.structuredResponseMode).toBe('analysis');
    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('allows productivity context when user explicitly asks', () => {
    const filtered = applyContextProfile({
      profile: 'conversation',
      queryText: 'How is my work-life balance and productivity score trending?',
      blocks: [
        {
          title: 'Cross-module insights',
          sourceType: 'module',
          content: [{ title: 'Work-Life Balance Improving' }],
          priority: 'medium',
          relevanceScore: 50,
        },
      ],
    });
    expect(filtered.includedTitles).toContain('Cross-module insights');
  });
});
