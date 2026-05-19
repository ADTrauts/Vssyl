import { describe, expect, it } from 'vitest';
import { formatBusinessWorkspacePolicyLines } from '../businessWorkspaceBoundaries';
import { assembleAIContext } from '../../context/AIContextAssembler';
import { BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE } from '../businessWorkspaceBoundaries';
import { PREFERENCE_CONTEXT_BLOCK_TITLE } from '../../preferences/PreferenceResolver';
import type { UserContext } from '../../context/CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: [],
  crossModuleInsights: [],
  currentFocus: { module: 'ai', activity: 'chat', priority: 'medium', timeSpent: 0 },
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

describe('formatBusinessWorkspacePolicyLines', () => {
  it('maps restrictions and compliance to policy lines', () => {
    const { policyLines } = formatBusinessWorkspacePolicyLines({
      complianceMode: true,
      securityLevel: 'high',
      restrictions: {
        employeeDataAccess: 'limited',
        clientDataAccess: 'none',
        financialDataAccess: false,
        forbiddenTopics: ['HR disputes', 'legal advice'],
      },
    });
    expect(policyLines.some((l) => l.includes('Compliance'))).toBe(true);
    expect(policyLines.some((l) => l.includes('Employee data'))).toBe(true);
    expect(policyLines.some((l) => l.includes('Forbidden topics'))).toBe(true);
  });
});

describe('assembleAIContext business workspace block', () => {
  it('includes business policy block before personal preferences when both provided', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Draft a client email',
        userId: 'u1',
        context: { businessId: 'biz-1' },
      },
      userContext: baseUserContext,
      businessWorkspaceBoundaries: {
        businessId: 'biz-1',
        businessName: 'Acme Co',
        securityLevel: 'standard',
        complianceMode: false,
        policyLines: ['Client data: no access'],
      },
      effectivePreferencesContextBlock: {
        communication: { tone: 'casual', verbosity: 'brief', styleNotes: 'friendly' },
        response: { structure: 'conversational', recommendationRichness: 'balanced' },
        boundaries: [],
      },
    });

    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles).toContain(BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE);
    expect(titles).toContain(PREFERENCE_CONTEXT_BLOCK_TITLE);
    const bizBlock = assembled.contextBlocks.find((b) => b.title === BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE);
    expect(bizBlock?.sourceType).toBe('business');
    expect(bizBlock?.priority).toBe('high');
  });
});
