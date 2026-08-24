/**
 * Retrieval-only fixture tests for authenticated identity + HR self_employment.
 * Skips cleanly when the AI truth fixture is not seeded.
 */
import { describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  HrAiContextError,
  buildHrSelfEmploymentContext,
  verifyHrAiContextAccess,
} from '../hrAiContextService';
import { assembleAIContext } from '../../ai/context/AIContextAssembler';
import type { UserContext } from '../../ai/context/CrossModuleContextEngine';
import { selectContextProvider } from '../../ai/services/moduleContextProviderSelection';
import { getUpcomingEventsForAI } from '../calendarVisibilityService';
import { requiresAuthoritativeContext } from '../../ai/utils/requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../../ai/utils/structuredResponseMode';

const hasDb = Boolean(process.env.DATABASE_URL);
const FIXTURE_BUSINESS_ID = 'a1t00000-0000-4000-a000-000000000001';
const FIXTURE_EMPLOYEE_EMAIL = 'ai.truth.employee@vssyl.local';
const FIXTURE_EVENT_TITLE = 'Weekly Dietary Meeting';

const baseUserContext: UserContext = {
  userId: 'fixture-user',
  timestamp: new Date(),
  activeModules: ['hr', 'calendar'],
  crossModuleInsights: [],
  currentFocus: { module: 'hr', activity: 'chat', priority: 'medium', timeSpent: 0 },
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

async function loadFixtureEmployee() {
  return prisma.user.findUnique({
    where: { email: FIXTURE_EMPLOYEE_EMAIL },
    select: { id: true, name: true, email: true },
  });
}

describe.skipIf(!hasDb)('AI truth self-identity + HR self-org retrieval', () => {
  it('assembles authenticated identity from User name/email', async () => {
    const employee = await loadFixtureEmployee();
    if (!employee) return;

    const assembled = assembleAIContext({
      query: {
        query: 'What is my email?',
        userId: employee.id,
        context: {},
      },
      userContext: { ...baseUserContext, userId: employee.id },
      authenticatedIdentity: {
        name: employee.name,
        email: employee.email,
      },
    });

    const identityBlock = assembled.contextBlocks.find((b) => b.title === 'Authenticated identity');
    expect(identityBlock?.content).toEqual({
      name: 'AI Truth Employee',
      email: FIXTURE_EMPLOYEE_EMAIL,
    });
    expect(identityBlock?.sourceType).toBe('personal');
    expect(assembled.evidence.some((e) => e.detail === FIXTURE_EMPLOYEE_EMAIL)).toBe(true);
  });

  it('HR self_employment retrieves fixture title, department, manager', async () => {
    const employee = await loadFixtureEmployee();
    if (!employee) return;

    await verifyHrAiContextAccess(employee.id, FIXTURE_BUSINESS_ID);
    const payload = await buildHrSelfEmploymentContext(FIXTURE_BUSINESS_ID, employee.id);

    expect(payload.context.employmentAvailable).toBe(true);
    expect(payload.context.positionTitle).toBe('Dietary Supervisor');
    expect(payload.context.department).toBe('Dietary');
    expect(payload.context.managerName).toBe('AI Truth Manager');
    expect(payload.context.managerEmail).toBe('ai.truth.manager@vssyl.local');
    expect(payload.context.managerStatus).toBe('assigned');
  });

  it('carries HR self provider payload into assembler module context + evidence', async () => {
    const employee = await loadFixtureEmployee();
    if (!employee) return;

    const payload = await buildHrSelfEmploymentContext(FIXTURE_BUSINESS_ID, employee.id);
    const assembled = assembleAIContext({
      query: {
        query: 'Who is my manager?',
        userId: employee.id,
        context: { businessId: FIXTURE_BUSINESS_ID },
      },
      userContext: { ...baseUserContext, userId: employee.id },
      authenticatedIdentity: {
        name: employee.name,
        email: employee.email,
      },
      moduleContexts: {
        hr: {
          moduleId: 'hr',
          moduleName: 'HR',
          providerName: 'self_employment',
          relevance: 'high',
          data: payload.context,
        },
      },
    });

    const moduleBlock = assembled.contextBlocks.find((b) =>
      String(b.title).includes('Module live context')
    );
    expect(JSON.stringify(moduleBlock?.content)).toContain('Dietary Supervisor');
    expect(JSON.stringify(moduleBlock?.content)).toContain('AI Truth Manager');
    expect(assembled.evidence.some((e) => e.sourceType === 'module' && e.sourceId === 'hr')).toBe(
      true
    );
  });

  it('rejects cross-tenant self-org access', async () => {
    const employee = await loadFixtureEmployee();
    if (!employee) return;

    const otherBiz = await prisma.business.findFirst({
      where: {
        id: { not: FIXTURE_BUSINESS_ID },
        members: { none: { userId: employee.id, isActive: true } },
      },
      select: { id: true },
    });
    if (!otherBiz) return;

    await expect(verifyHrAiContextAccess(employee.id, otherBiz.id)).rejects.toBeInstanceOf(
      HrAiContextError
    );
  });

  it('Calendar upcoming events regression for fixture employee', async () => {
    const employee = await loadFixtureEmployee();
    if (!employee) return;

    const upcoming = await getUpcomingEventsForAI(employee.id);
    expect(upcoming.upcomingEvents.some((e) => e.title === FIXTURE_EVENT_TITLE)).toBe(true);
  });

  it('does not auto-select self_employment for salt / default HR queries', () => {
    const providers = [
      {
        name: 'hr_overview',
        endpoint: '/api/hr/ai/context/overview',
        description: 'overview',
      },
      {
        name: 'employee_count',
        endpoint: '/api/hr/ai/context/headcount',
        description: 'count',
      },
      {
        name: 'time_off_summary',
        endpoint: '/api/hr/ai/context/time-off',
        description: 'pto',
      },
      {
        name: 'self_employment',
        endpoint: '/api/hr/ai/context/self-employment',
        description: 'self',
      },
    ];

    expect(selectContextProvider('hr', 'Why does salt melt ice?', providers)?.name).toBe(
      'hr_overview'
    );
    expect(selectContextProvider('hr', 'Show HR overview', providers)?.name).toBe('hr_overview');
    expect(selectContextProvider('hr', 'What is our employee count by department?', providers)?.name).toBe(
      'employee_count'
    );
    expect(selectContextProvider('hr', 'Who is off today on PTO?', providers)?.name).toBe(
      'time_off_summary'
    );
    // Explicit: self_employment is never default-selected by current matching
    expect(selectContextProvider('hr', 'Who is my manager?', providers)?.name).toBe('hr_overview');
    expect(selectContextProvider('hr', "What's my job title?", providers)?.name).toBe('hr_overview');
  });

  it('routing signals remain unchanged for self identity/org queries', () => {
    const biz = FIXTURE_BUSINESS_ID;
    const email = inferStructuredResponseMode({
      query: 'What is my email?',
      toneMode: 'conversational',
      businessId: biz,
    });
    expect(email.requiresAuthoritativeContext).toBe(false);
    expect(email.responseContract).toBe('conversation');

    const title = inferStructuredResponseMode({
      query: "What's my job title?",
      toneMode: 'conversational',
      businessId: biz,
    });
    expect(title.requiresAuthoritativeContext).toBe(false);
    expect(title.responseContract).toBe('conversation');

    const dept = inferStructuredResponseMode({
      query: 'What department am I in?',
      toneMode: 'conversational',
      businessId: biz,
    });
    expect(dept.requiresAuthoritativeContext).toBe(true);
    expect(dept.responseContract).toBe('grounded_answer');

    const manager = inferStructuredResponseMode({
      query: 'Who is my manager?',
      toneMode: 'conversational',
      businessId: biz,
    });
    expect(manager.requiresAuthoritativeContext).toBe(true);
    expect(manager.responseContract).toBe('grounded_answer');

    expect(requiresAuthoritativeContext({ query: 'What is my email?', businessId: biz })).toBe(
      false
    );
    expect(
      requiresAuthoritativeContext({ query: "What's my job title?", businessId: biz })
    ).toBe(false);
  });
});
