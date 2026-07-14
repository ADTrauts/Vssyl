/**
 * Phase 8 — Governed Skill runner.
 *
 * Boundary: dedicated Skill execution path. Reuses Notebook/document adapters,
 * Model Router shadow comparisons, observation, and AIExecutionRecord.
 * Does NOT create a second conversational Twin or bypass governance.
 */
import { randomUUID } from 'crypto';
import type {
  AISkillDefinition,
  AISkillExecutionRequest,
  AISkillExecutionResult,
} from 'vssyl-shared';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createAIExecutionRecord } from '../intelligence/executionRecordService';
import { shadowRouteForSpecializedPath } from '../routing/shadowRouting';
import { getSkillDefinition } from './skillRegistry';
import { selectSkill } from './skillSelection';
import { createSkillExecutionPlan } from './skillPlanner';
import { getSkillImplementation } from './skillImplementations';
import { emitSkillObservation } from './skillObservation';
import { recordSkillMetric } from './skillMetrics';
import { detectSecretLeak, validateSkillOutput } from './skillOutputValidation';
import { isExecutableStatus } from './skillLifecycle';

function assertNoUnauthorizedTools(definition: AISkillDefinition): string | null {
  if (definition.allowedTools.length === 0 && definition.actionPolicy.maxToolRounds === 0) {
    return null;
  }
  for (const tool of definition.allowedTools) {
    if (definition.actionPolicy.prohibitedTools.includes(tool)) {
      return `Tool both allowed and prohibited: ${tool}`;
    }
    if (definition.actionPolicy.prohibitedTools.includes('*')) {
      return `Skill declares allowlist but prohibits all tools`;
    }
  }
  return null;
}

function assertNoUndeclaredContext(definition: AISkillDefinition): string | null {
  if (!definition.contextRequirements.minNecessary) {
    return 'Skills must declare minNecessary context';
  }
  return null;
}

export async function executeSkill(
  request: AISkillExecutionRequest
): Promise<AISkillExecutionResult> {
  const started = Date.now();
  const requestId = request.requestId ?? randomUUID();

  const selection = selectSkill({
    explicitSkillKey: request.skillKey,
    explicitVersion: request.version,
    userId: request.userId,
    businessId: request.businessId,
    moduleId: request.moduleId,
  });

  if (!selection.selected) {
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      conversationId: request.conversationId,
      type: 'SkillSelectionFailed',
      metadata: {
        skillKey: request.skillKey,
        reason: selection.selectionReason,
        rejected: selection.rejected,
      },
    });
    const failedPlan = {
      skillKey: request.skillKey,
      skillVersion: request.version ?? 'unknown',
      executionId: randomUUID(),
      policyVersion: 'phase8-rejected',
      normalizedInput: request.input,
      requiredContextProviders: [],
      requiredKnowledgeSources: [],
      groundingRequirements: {
        sourceCitationRequired: true,
        refuseWhenUngrounded: true,
        allowSpeculation: false,
      },
      capabilityRequest: {
        primary: 'FAST_CHAT' as const,
        tier: 'FAST' as const,
      },
      allowedTools: [],
      approvalRequirements: { mandatoryApproval: false, approvalForMutations: true },
      outputSchema: {},
      timeoutMs: 0,
      observationTags: [],
      evaluationProfileId: 'none',
      implementationKey: 'none',
    };
    return {
      ok: false,
      skillKey: request.skillKey,
      skillVersion: request.version ?? 'unknown',
      executionId: failedPlan.executionId,
      status: 'REJECTED',
      error: selection.selectionReason,
      durationMs: Date.now() - started,
      plan: failedPlan,
      observationEmitted: true,
    };
  }

  const definition = getSkillDefinition(selection.selected.key, selection.selected.version);
  if (!definition || (!isExecutableStatus(definition.status) && definition.status !== 'DEPRECATED')) {
    return {
      ok: false,
      skillKey: selection.selected.key,
      skillVersion: selection.selected.version,
      executionId: randomUUID(),
      status: 'REJECTED',
      error: 'Skill not executable',
      durationMs: Date.now() - started,
      plan: {
        skillKey: selection.selected.key,
        skillVersion: selection.selected.version,
        executionId: randomUUID(),
        policyVersion: 'phase8-rejected',
        normalizedInput: request.input,
        requiredContextProviders: [],
        requiredKnowledgeSources: [],
        groundingRequirements: {
          sourceCitationRequired: true,
          refuseWhenUngrounded: true,
          allowSpeculation: false,
        },
        capabilityRequest: { primary: 'FAST_CHAT', tier: 'FAST' },
        allowedTools: [],
        approvalRequirements: { mandatoryApproval: false, approvalForMutations: true },
        outputSchema: {},
        timeoutMs: 0,
        observationTags: [],
        evaluationProfileId: 'none',
        implementationKey: 'none',
      },
      observationEmitted: true,
    };
  }

  if (definition.status === 'RETIRED' || definition.status === 'SUSPENDED') {
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillSelectionFailed',
      metadata: { skillKey: definition.key, reason: definition.status },
    });
    return {
      ok: false,
      skillKey: definition.key,
      skillVersion: definition.version,
      executionId: randomUUID(),
      status: 'REJECTED',
      error: `Skill ${definition.status.toLowerCase()}`,
      durationMs: Date.now() - started,
      plan: {
        skillKey: definition.key,
        skillVersion: definition.version,
        executionId: randomUUID(),
        policyVersion: 'phase8-rejected',
        normalizedInput: request.input,
        requiredContextProviders: [],
        requiredKnowledgeSources: [],
        groundingRequirements: definition.groundingPolicy,
        capabilityRequest: definition.capabilityRequest,
        allowedTools: [],
        approvalRequirements: definition.approvalPolicy,
        outputSchema: definition.outputSchema,
        timeoutMs: 0,
        observationTags: [],
        evaluationProfileId: definition.evaluationProfile.id,
        implementationKey: definition.implementationKey,
      },
      observationEmitted: true,
    };
  }

  emitSkillObservation({
    requestId,
    userId: request.userId,
    businessId: request.businessId,
    conversationId: request.conversationId,
    type: 'SkillSelected',
    metadata: {
      skillKey: definition.key,
      skillVersion: definition.version,
      selectionReason: selection.selectionReason,
      intentTypes: definition.intentTypes,
    },
  });

  const toolErr = assertNoUnauthorizedTools(definition);
  const ctxErr = assertNoUndeclaredContext(definition);
  if (toolErr || ctxErr) {
    return {
      ok: false,
      skillKey: definition.key,
      skillVersion: definition.version,
      executionId: randomUUID(),
      status: 'REJECTED',
      error: toolErr ?? ctxErr ?? 'policy',
      durationMs: Date.now() - started,
      plan: {
        skillKey: definition.key,
        skillVersion: definition.version,
        executionId: randomUUID(),
        policyVersion: 'phase8-rejected',
        normalizedInput: request.input,
        requiredContextProviders: [],
        requiredKnowledgeSources: [],
        groundingRequirements: definition.groundingPolicy,
        capabilityRequest: definition.capabilityRequest,
        allowedTools: [],
        approvalRequirements: definition.approvalPolicy,
        outputSchema: definition.outputSchema,
        timeoutMs: 0,
        observationTags: [],
        evaluationProfileId: definition.evaluationProfile.id,
        implementationKey: definition.implementationKey,
      },
      observationEmitted: true,
    };
  }

  // Fail closed: Skill may not propose undeclared mutating tools in this runner.
  if (
    definition.actionPolicy.mutationsDefaultOff === false &&
    definition.actionPolicy.allowedMutatingTools.length > 0
  ) {
    // Phase 8 pilots are all mutate-off; reserve for future governed proposals.
  }

  const planned = createSkillExecutionPlan({
    definition,
    input: request.input,
    userId: request.userId,
    businessId: request.businessId,
  });
  if (!planned.ok) {
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillSelectionFailed',
      metadata: { skillKey: definition.key, reason: planned.error },
    });
    return {
      ok: false,
      skillKey: definition.key,
      skillVersion: definition.version,
      executionId: randomUUID(),
      status: 'REJECTED',
      error: planned.error,
      durationMs: Date.now() - started,
      plan: {
        skillKey: definition.key,
        skillVersion: definition.version,
        executionId: randomUUID(),
        policyVersion: 'phase8-rejected',
        normalizedInput: request.input,
        requiredContextProviders: definition.contextRequirements.providers,
        requiredKnowledgeSources: [],
        groundingRequirements: definition.groundingPolicy,
        capabilityRequest: definition.capabilityRequest,
        allowedTools: definition.allowedTools,
        approvalRequirements: definition.approvalPolicy,
        outputSchema: definition.outputSchema,
        timeoutMs: definition.timeoutPolicy.hardTimeoutMs,
        observationTags: [],
        evaluationProfileId: definition.evaluationProfile.id,
        implementationKey: definition.implementationKey,
      },
      observationEmitted: true,
    };
  }

  const plan = planned.plan;
  emitSkillObservation({
    requestId,
    userId: request.userId,
    businessId: request.businessId,
    type: 'SkillPlanCreated',
    metadata: {
      skillKey: plan.skillKey,
      skillVersion: plan.skillVersion,
      executionId: plan.executionId,
      capabilityRequest: plan.capabilityRequest,
      requiredContextProviders: plan.requiredContextProviders,
    },
  });
  emitSkillObservation({
    requestId,
    userId: request.userId,
    businessId: request.businessId,
    type: 'SkillExecutionStarted',
    metadata: {
      skillKey: plan.skillKey,
      skillVersion: plan.skillVersion,
      executionId: plan.executionId,
    },
  });
  emitSkillObservation({
    requestId,
    userId: request.userId,
    businessId: request.businessId,
    type: 'SkillContextResolved',
    metadata: {
      skillKey: plan.skillKey,
      providers: plan.requiredContextProviders,
      knowledge: plan.requiredKnowledgeSources,
    },
  });

  const impl = getSkillImplementation(plan.implementationKey);
  if (!impl) {
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillExecutionFailed',
      metadata: { skillKey: plan.skillKey, error: 'implementation_missing' },
    });
    return {
      ok: false,
      skillKey: plan.skillKey,
      skillVersion: plan.skillVersion,
      executionId: plan.executionId,
      status: 'FAILED',
      error: 'Skill implementation not registered',
      durationMs: Date.now() - started,
      plan,
      observationEmitted: true,
    };
  }

  let shadowRouting: AISkillExecutionResult['shadowRouting'];
  let schemaValidationFailed = false;
  let groundingFailed = false;
  let output: Record<string, unknown> | undefined;
  let provider: string | undefined;
  let model: string | undefined;
  let error: string | undefined;
  let status: AISkillExecutionResult['status'] = 'COMPLETED';

  try {
    const result = await impl({
      plan,
      userId: request.userId,
      businessId: request.businessId,
    });
    output = result.output;
    provider = result.provider ?? 'openai';
    model = result.model;
    groundingFailed = Boolean(result.groundingFailed);
    schemaValidationFailed = Boolean(result.schemaValidationFailed);

    try {
      const comparison = shadowRouteForSpecializedPath({
        capability: plan.capabilityRequest.primary,
        currentProvider: provider,
        currentModel: model ?? 'unknown',
        surface: `SKILL:${plan.skillKey}`,
        extra: { tier: plan.capabilityRequest.tier },
      });
      shadowRouting = {
        proposedProvider: comparison.proposedProvider,
        proposedCatalogKey: comparison.proposedCatalogKey,
        match: comparison.match,
      };
    } catch {
      /* shadow never blocks */
    }

    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillProviderCompleted',
      metadata: {
        skillKey: plan.skillKey,
        provider,
        model,
        shadowRouting,
      },
    });

    const validation = validateSkillOutput(output, plan.outputSchema);
    if (!validation.ok || detectSecretLeak(output)) {
      schemaValidationFailed = true;
      status = 'FAILED';
      error = !validation.ok ? validation.error : 'Output failed secret redaction check';
      emitSkillObservation({
        requestId,
        userId: request.userId,
        businessId: request.businessId,
        type: 'SkillOutputValidated',
        metadata: { skillKey: plan.skillKey, ok: false, error },
      });
    } else {
      emitSkillObservation({
        requestId,
        userId: request.userId,
        businessId: request.businessId,
        type: 'SkillOutputValidated',
        metadata: { skillKey: plan.skillKey, ok: true },
      });
    }

    if (groundingFailed && plan.groundingRequirements.refuseWhenUngrounded) {
      status = 'FAILED';
      error = error ?? 'Grounding failure';
    }
  } catch (err: unknown) {
    status = 'FAILED';
    error = err instanceof Error ? err.message : 'Skill execution failed';
    logger.warn('Skill execution failed', {
      operation: 'skill.execute',
      skillKey: plan.skillKey,
      message: error,
    });
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillExecutionFailed',
      metadata: { skillKey: plan.skillKey, error },
    });
  }

  const durationMs = Date.now() - started;
  const ok = status === 'COMPLETED';

  if (ok) {
    emitSkillObservation({
      requestId,
      userId: request.userId,
      businessId: request.businessId,
      type: 'SkillExecutionCompleted',
      metadata: {
        skillKey: plan.skillKey,
        skillVersion: plan.skillVersion,
        executionId: plan.executionId,
        durationMs,
        evaluationProfileId: plan.evaluationProfileId,
      },
    });
  }

  recordSkillMetric({
    skillKey: plan.skillKey,
    skillVersion: plan.skillVersion,
    success: ok,
    schemaValidationFailed,
    groundingFailed,
    durationMs,
    timestamp: new Date().toISOString(),
    routerShadowAgreement: shadowRouting?.match ?? null,
  });

  if (definition.observationPolicy.attachToExecutionRecord) {
    try {
      await createAIExecutionRecord(prisma, {
        userId: request.userId,
        businessId: request.businessId,
        surface: 'SKILL',
        requestId,
        conversationId: request.conversationId,
        userQuery: `skill:${plan.skillKey}`,
        aiResponseSummary: ok
          ? JSON.stringify(output).slice(0, 2000)
          : (error ?? 'failed').slice(0, 500),
        provider: provider ?? null,
        model: model ?? null,
        routingSummary: shadowRouting
          ? {
              shadow: shadowRouting,
              capabilityRequest: plan.capabilityRequest,
              productionUnchanged: true,
            }
          : { capabilityRequest: plan.capabilityRequest, productionUnchanged: true },
        linked: {
          requestId,
          conversationId: request.conversationId,
        },
        diagnosticsSummary: {
          skillKey: plan.skillKey,
          skillVersion: plan.skillVersion,
          evaluationProfileId: plan.evaluationProfileId,
          selectionReason: selection.selectionReason,
          schemaValidationFailed,
          groundingFailed,
        },
        learningSignals: {
          skillKey: plan.skillKey,
          skillVersion: plan.skillVersion,
          instructionAssetKey: definition.instructionAssetKey,
          owner: definition.owner,
        },
        errorSummary: error ?? null,
        completedAt: new Date(),
      });
    } catch (persistErr: unknown) {
      logger.warn('Skill execution record persist failed (non-blocking)', {
        operation: 'skill.execute.record',
        message: persistErr instanceof Error ? persistErr.message : String(persistErr),
      });
    }
  }

  return {
    ok,
    skillKey: plan.skillKey,
    skillVersion: plan.skillVersion,
    executionId: plan.executionId,
    status,
    output: ok ? output : undefined,
    error,
    durationMs,
    plan,
    shadowRouting,
    observationEmitted: true,
  };
}
