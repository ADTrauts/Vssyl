import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import {
  VLINK_GROUNDING_INTENT_IDS,
  computeGroundingRuleReconcileAction,
  listSystemDefaultGroundingRules,
  mergeSystemGroundingOptionalSources,
  optionalSourcesForInferredIntents,
} from '../pipelineGroundingRuleReconcile';
import { reconcileSystemPipelineGroundingRules } from '../pipelineCatalogService';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    aIPipelineGroundingRulePolicy: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../../lib/prisma';

const findUniqueMock = prisma.aIPipelineGroundingRulePolicy.findUnique as unknown as ReturnType<
  typeof vi.fn
>;
const createMock = prisma.aIPipelineGroundingRulePolicy.create as unknown as ReturnType<typeof vi.fn>;
const updateMock = prisma.aIPipelineGroundingRulePolicy.update as unknown as ReturnType<typeof vi.fn>;

describe('pipelineGroundingRuleReconcile helpers', () => {
  it('default rules include vlink on planning, workflow, business, and technical intents', () => {
    for (const intentId of VLINK_GROUNDING_INTENT_IDS) {
      const rule = listSystemDefaultGroundingRules().find((r) => r.intentId === intentId);
      expect(rule?.optionalSources).toContain('vlink');
    }
  });

  it('mergeSystemGroundingOptionalSources is idempotent', () => {
    const first = mergeSystemGroundingOptionalSources(
      ['calendar', 'drive_files'],
      ['vlink', 'calendar']
    );
    expect(first).toEqual(['calendar', 'drive_files', 'vlink']);

    const second = mergeSystemGroundingOptionalSources(first, ['vlink', 'calendar']);
    expect(second).toEqual(first);
  });

  it('computeGroundingRuleReconcileAction inserts missing system rules', () => {
    const planning = listSystemDefaultGroundingRules().find((r) => r.intentId === 'planning');
    expect(planning).toBeDefined();
    expect(computeGroundingRuleReconcileAction(null, planning!)).toBe('insert');
  });

  it('computeGroundingRuleReconcileAction merges vlink into existing system rules', () => {
    const business = listSystemDefaultGroundingRules().find((r) => r.intentId === 'business_operations');
    expect(business).toBeDefined();
    expect(
      computeGroundingRuleReconcileAction(
        {
          intentId: 'business_operations',
          requiredSources: ['business_context', 'module_context'],
          optionalSources: ['notifications_activity', 'calendar'],
          isSystem: true,
          archived: false,
        },
        business!
      )
    ).toBe('merge_optional');
  });

  it('computeGroundingRuleReconcileAction skips non-system customized rows', () => {
    const workflow = listSystemDefaultGroundingRules().find((r) => r.intentId === 'workflow_action');
    expect(workflow).toBeDefined();
    expect(
      computeGroundingRuleReconcileAction(
        {
          intentId: 'workflow_action',
          requiredSources: [],
          optionalSources: ['calendar'],
          isSystem: false,
          archived: false,
        },
        workflow!
      )
    ).toBe('skip');
  });

  it('computeGroundingRuleReconcileAction skips when optional sources already merged', () => {
    const planning = listSystemDefaultGroundingRules().find((r) => r.intentId === 'planning');
    expect(planning).toBeDefined();
    expect(
      computeGroundingRuleReconcileAction(
        {
          intentId: 'planning',
          requiredSources: [],
          optionalSources: planning!.optionalSources,
          isSystem: true,
          archived: false,
        },
        planning!
      )
    ).toBe('skip');
  });

  it('optionalSourcesForInferredIntents reads reconciled catalog rules', () => {
    const catalog = getDefaultPipelineCatalog();
    const sources = optionalSourcesForInferredIntents(catalog, ['planning', 'workflow_action']);
    expect(sources.has('vlink')).toBe(true);
    expect(sources.has('calendar')).toBe(true);
  });
});

describe('reconcileSystemPipelineGroundingRules', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
  });

  it('inserts missing planning and workflow rules', async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});

    const result = await reconcileSystemPipelineGroundingRules();

    expect(result.inserted).toBeGreaterThan(0);
    expect(createMock).toHaveBeenCalled();
  });

  it('merges vlink into existing business_operations without overwriting required sources', async () => {
    findUniqueMock.mockImplementation((args: { where: { intentId?: string } }) => {
      const intentId = args.where.intentId ?? '';
      if (intentId === 'business_operations') {
        return Promise.resolve({
          intentId: 'business_operations',
          requiredSources: ['business_context', 'module_context'],
          optionalSources: ['notifications_activity', 'calendar'],
          isSystem: true,
          archived: false,
        } as never);
      }
      return Promise.resolve({
        intentId,
        requiredSources: [],
        optionalSources: ['vlink'],
        isSystem: true,
        archived: false,
      } as never);
    });
    updateMock.mockResolvedValue({});

    const result = await reconcileSystemPipelineGroundingRules();

    expect(result.updated).toBeGreaterThanOrEqual(1);
    const businessUpdate = updateMock.mock.calls.find((call) => {
      const first = call[0] as {
        where?: { intentId?: string };
        data?: { optionalSources?: string[] };
      };
      return first?.where?.intentId === 'business_operations';
    });
    expect(businessUpdate).toBeDefined();
    expect(businessUpdate![0].data.optionalSources).toEqual(
      expect.arrayContaining(['notifications_activity', 'calendar', 'vlink', 'graph_bundle'])
    );
  });

  it('is idempotent on second run when DB already matches defaults', async () => {
    findUniqueMock.mockImplementation((args: { where: { intentId?: string } }) => {
      const intentId = args.where.intentId ?? '';
      const rule = listSystemDefaultGroundingRules().find((r) => r.intentId === intentId);
      return Promise.resolve({
        intentId,
        requiredSources: rule?.requiredSources ?? [],
        optionalSources: rule?.optionalSources ?? [],
        isSystem: true,
        archived: false,
      } as never);
    });

    const first = await reconcileSystemPipelineGroundingRules();
    const second = await reconcileSystemPipelineGroundingRules();

    expect(first.inserted).toBe(0);
    expect(first.updated).toBe(0);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(0);
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
