/**
 * Phase 8 — Pure skill execution planner (no providers / tools).
 */
import { randomUUID } from 'crypto';
import {
  AI_SKILLS_POLICY_VERSION,
  type AISkillDefinition,
  type AISkillExecutionPlan,
} from 'vssyl-shared';
import { isExecutableStatus } from './skillLifecycle';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateRequiredFields(
  input: Record<string, unknown>,
  schema: Record<string, unknown>
): string | null {
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  for (const key of required) {
    if (input[key] === undefined || input[key] === null || input[key] === '') {
      return `Missing required input field: ${key}`;
    }
  }
  const properties =
    schema.properties && typeof schema.properties === 'object'
      ? (schema.properties as Record<string, unknown>)
      : {};
  for (const key of Object.keys(input)) {
    if (!(key in properties) && schema.additionalProperties === false) {
      return `Unsupported input field: ${key}`;
    }
  }
  return null;
}

export function createSkillExecutionPlan(params: {
  definition: AISkillDefinition;
  input: Record<string, unknown>;
  userId: string;
  businessId?: string | null;
}): { ok: true; plan: AISkillExecutionPlan } | { ok: false; error: string } {
  const { definition, input, businessId } = params;

  if (!isExecutableStatus(definition.status) && definition.status !== 'DEPRECATED') {
    return { ok: false, error: `Skill not executable: ${definition.status}` };
  }
  if (definition.status === 'SUSPENDED' || definition.status === 'RETIRED') {
    return { ok: false, error: `Skill ${definition.status.toLowerCase()}` };
  }
  if (definition.contextRequirements.businessMembershipRequired && !businessId) {
    return { ok: false, error: 'Business membership required' };
  }
  if (!isPlainObject(input)) {
    return { ok: false, error: 'Input must be an object' };
  }

  const inputError = validateRequiredFields(input, definition.inputSchema);
  if (inputError) return { ok: false, error: inputError };

  // Bound input size (characters of JSON)
  const serialized = JSON.stringify(input);
  if (serialized.length > 200_000) {
    return { ok: false, error: 'Input exceeds size limit' };
  }

  const plan: AISkillExecutionPlan = {
    skillKey: definition.key,
    skillVersion: definition.version,
    executionId: randomUUID(),
    policyVersion: AI_SKILLS_POLICY_VERSION,
    normalizedInput: { ...input },
    requiredContextProviders: [...definition.contextRequirements.providers],
    requiredKnowledgeSources: [
      ...(definition.knowledgeRequirements.liveModuleSoR ? ['live_module_sor'] : []),
      ...(definition.knowledgeRequirements.platformGuidance ? ['platform_guidance'] : []),
    ],
    groundingRequirements: { ...definition.groundingPolicy },
    capabilityRequest: { ...definition.capabilityRequest },
    allowedTools: [...definition.allowedTools],
    approvalRequirements: { ...definition.approvalPolicy },
    outputSchema: definition.outputSchema,
    timeoutMs: definition.timeoutPolicy.hardTimeoutMs,
    observationTags: [`skill:${definition.key}`, `skillVersion:${definition.version}`],
    evaluationProfileId: definition.evaluationProfile.id,
    implementationKey: definition.implementationKey,
  };

  return { ok: true, plan };
}
