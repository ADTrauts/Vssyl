/**
 * Phase 8 — AI Skills framework tests (no real provider calls).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AISkillDefinition } from 'vssyl-shared';
import {
  assertSkillStatusTransition,
  canTransitionSkillStatus,
  IMMUTABLE_AFTER,
  isExecutableStatus,
} from '../skillLifecycle';
import {
  clearSkillRegistryForTests,
  getSkillDefinition,
  listSkillDefinitions,
  listSkillRegistryItems,
  registerSkillDefinition,
} from '../skillRegistry';
import { selectSkill } from '../skillSelection';
import { createSkillExecutionPlan } from '../skillPlanner';
import {
  clearSkillImplementationsForTests,
  registerSkillImplementation,
} from '../skillImplementations';
import { executeSkill } from '../skillRunner';
import { clearSkillMetricsForTests, summarizeSkillMetrics } from '../skillMetrics';
import { detectSecretLeak, validateSkillOutput } from '../skillOutputValidation';
import { NOTEBOOK_PAGE_SUMMARY_V1 } from '../pilotSkillDefinitions';
import { resetAndRegisterBuiltInSkillsForTests } from '../registerBuiltInSkills';

vi.mock('../../intelligence/executionRecordService', () => ({
  createAIExecutionRecord: vi.fn().mockResolvedValue({ id: 'exec-1' }),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {},
}));

vi.mock('../../routing/shadowRouting', () => ({
  shadowRouteForSpecializedPath: vi.fn(() => ({
    proposedProvider: 'openai',
    proposedCatalogKey: 'openai.balanced',
    match: true,
    policyVersion: 'phase7',
    requestedCapability: 'STRUCTURED_SUMMARY',
    selectedTier: 'BALANCED',
    currentProvider: 'openai',
    proposedProviderModelId: 'gpt-4o-mini',
    routingReason: 'test',
    confidence: 1,
    providerMatch: true,
    modelMatch: true,
    candidateModels: [],
    fallbackChain: [],
    surface: 'SKILL',
    recordedAt: new Date().toISOString(),
  })),
}));

vi.mock('../../observation/runtimeObservation', () => ({
  emitTwinObservation: vi.fn(),
}));

function draftSkill(overrides: Partial<AISkillDefinition> = {}): AISkillDefinition {
  return {
    ...NOTEBOOK_PAGE_SUMMARY_V1,
    key: overrides.key ?? 'test_skill',
    version: overrides.version ?? '1.0.0',
    status: overrides.status ?? 'ACTIVE',
    implementationKey: overrides.implementationKey ?? 'impl.test_skill.v1',
    ...overrides,
  };
}

describe('Phase 8 Skill lifecycle', () => {
  it('allows legal transitions and rejects illegal ones', () => {
    expect(canTransitionSkillStatus('DRAFT', 'REVIEW')).toBe(true);
    expect(canTransitionSkillStatus('ACTIVE', 'DEPRECATED')).toBe(true);
    expect(canTransitionSkillStatus('RETIRED', 'ACTIVE')).toBe(false);
    expect(assertSkillStatusTransition('CERTIFIED', 'ACTIVE').ok).toBe(true);
    expect(assertSkillStatusTransition('DRAFT', 'ACTIVE').ok).toBe(false);
  });

  it('marks published statuses immutable and executable', () => {
    expect(IMMUTABLE_AFTER.has('ACTIVE')).toBe(true);
    expect(isExecutableStatus('ACTIVE')).toBe(true);
    expect(isExecutableStatus('DRAFT')).toBe(false);
  });
});

describe('Phase 8 Skill registry', () => {
  beforeEach(() => {
    clearSkillRegistryForTests();
  });

  it('rejects duplicate key@version', () => {
    registerSkillDefinition(draftSkill());
    expect(() => registerSkillDefinition(draftSkill())).toThrow(/Duplicate/);
  });

  it('resolves active version and lists by intent', () => {
    registerSkillDefinition(draftSkill({ version: '1.0.0', status: 'ACTIVE' }));
    registerSkillDefinition(
      draftSkill({
        version: '2.0.0',
        status: 'ACTIVE',
        intentTypes: ['DOCUMENT_SUMMARIZATION'],
      })
    );
    expect(getSkillDefinition('test_skill')?.version).toBe('2.0.0');
    expect(
      listSkillDefinitions({ intentType: 'DOCUMENT_SUMMARIZATION', executableOnly: true }).length
    ).toBeGreaterThan(0);
  });

  it('rejects inactive future scopes', () => {
    expect(() =>
      registerSkillDefinition(draftSkill({ scope: 'INDUSTRY_FUTURE' }))
    ).toThrow(/inactive/);
  });

  it('filters customer-visible registry items', () => {
    registerSkillDefinition(draftSkill({ customerVisible: true }));
    registerSkillDefinition(
      draftSkill({
        key: 'internal_only',
        version: '1.0.0',
        customerVisible: false,
        internalOnly: true,
        implementationKey: 'impl.internal.v1',
      })
    );
    expect(listSkillRegistryItems({ customerVisibleOnly: true })).toHaveLength(1);
  });
});

describe('Phase 8 Skill selection', () => {
  beforeEach(() => {
    clearSkillRegistryForTests();
    registerSkillDefinition(draftSkill());
  });

  it('uses explicit invocation authoritatively', () => {
    const result = selectSkill({
      explicitSkillKey: 'test_skill',
      userId: 'u1',
    });
    expect(result.selected?.key).toBe('test_skill');
    expect(result.selectionReason).toBe('explicit_invocation');
    expect(result.confidence).toBe(1);
  });

  it('rejects suspended Skills', () => {
    clearSkillRegistryForTests();
    registerSkillDefinition(draftSkill({ status: 'SUSPENDED' }));
    const result = selectSkill({ explicitSkillKey: 'test_skill', userId: 'u1' });
    expect(result.selected).toBeUndefined();
    expect(result.selectionReason).toBe('explicit_not_executable');
  });

  it('requires clarification when intent is ambiguous', () => {
    const result = selectSkill({ userId: 'u1', intentType: undefined });
    expect(result.clarificationRequired).toBe(true);
  });
});

describe('Phase 8 Skill planner', () => {
  it('validates required input and builds a declarative plan', () => {
    const planned = createSkillExecutionPlan({
      definition: draftSkill(),
      input: { pageId: 'p1' },
      userId: 'u1',
    });
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.plan.skillKey).toBe('test_skill');
      expect(planned.plan.capabilityRequest.primary).toBe('STRUCTURED_SUMMARY');
      expect(planned.plan.allowedTools).toEqual([]);
    }
  });

  it('rejects unsupported fields and missing required', () => {
    expect(
      createSkillExecutionPlan({
        definition: draftSkill(),
        input: {},
        userId: 'u1',
      }).ok
    ).toBe(false);
    expect(
      createSkillExecutionPlan({
        definition: draftSkill(),
        input: { pageId: 'p1', hack: true },
        userId: 'u1',
      }).ok
    ).toBe(false);
  });
});

describe('Phase 8 output validation', () => {
  it('validates required fields and rejects extras when closed', () => {
    expect(
      validateSkillOutput(
        { summary: 'x', keyDecisions: [], openTasks: [], risksAndFollowUps: [], warnings: [] },
        NOTEBOOK_PAGE_SUMMARY_V1.outputSchema
      ).ok
    ).toBe(true);
    expect(validateSkillOutput({ summary: 'x' }, NOTEBOOK_PAGE_SUMMARY_V1.outputSchema).ok).toBe(
      false
    );
    expect(
      validateSkillOutput(
        {
          summary: 'x',
          keyDecisions: [],
          openTasks: [],
          risksAndFollowUps: [],
          warnings: [],
          evil: 1,
        },
        NOTEBOOK_PAGE_SUMMARY_V1.outputSchema
      ).ok
    ).toBe(false);
  });

  it('detects leaked secrets', () => {
    expect(detectSecretLeak({ note: 'sk-abcdefghijklmnopqrstuvwxyz123456' })).toBe(true);
    expect(detectSecretLeak({ note: 'hello' })).toBe(false);
  });
});

describe('Phase 8 Skill runner', () => {
  beforeEach(async () => {
    clearSkillRegistryForTests();
    clearSkillImplementationsForTests();
    clearSkillMetricsForTests();
    registerSkillDefinition(draftSkill());
    registerSkillImplementation('impl.test_skill.v1', async () => ({
      output: {
        summary: 'ok',
        keyDecisions: [],
        openTasks: [],
        risksAndFollowUps: [],
        warnings: [],
      },
      provider: 'openai',
      model: 'gpt-4o-mini',
    }));
  });

  it('executes a successful pilot-shaped Skill without providers', async () => {
    const result = await executeSkill({
      skillKey: 'test_skill',
      input: { pageId: 'page-1' },
      userId: 'u1',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.output?.summary).toBe('ok');
    expect(result.shadowRouting?.match).toBe(true);
    expect(summarizeSkillMetrics('test_skill').successCount).toBe(1);
  });

  it('fails closed on unauthorized / missing Skill', async () => {
    const result = await executeSkill({
      skillKey: 'missing',
      input: {},
      userId: 'u1',
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('REJECTED');
  });

  it('fails on malformed provider output', async () => {
    clearSkillImplementationsForTests();
    registerSkillImplementation('impl.test_skill.v1', async () => ({
      output: { summary: 'only' },
      provider: 'openai',
      model: 'x',
    }));
    const result = await executeSkill({
      skillKey: 'test_skill',
      input: { pageId: 'page-1' },
      userId: 'u1',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Missing required output/);
  });

  it('rejects undeclared oversized input', async () => {
    const result = await executeSkill({
      skillKey: 'test_skill',
      input: { pageId: 'x'.repeat(200_001) },
      userId: 'u1',
    });
    expect(result.ok).toBe(false);
  });
});

describe('Phase 8 pilot registration', () => {
  it('registers three pilot Skills', async () => {
    await resetAndRegisterBuiltInSkillsForTests();
    const items = listSkillRegistryItems();
    expect(items.map((i) => i.key).sort()).toEqual([
      'notebook_action_extraction',
      'notebook_page_summary',
      'structured_document_extraction',
    ]);
  });
});
