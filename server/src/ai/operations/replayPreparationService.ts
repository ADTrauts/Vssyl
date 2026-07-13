/**
 * Phase 4 — Replay preparation (no execution).
 */
import type { PrismaClient } from '@prisma/client';
import type { AIReplayPreparationPreview, AIReplayPreparationRequest } from 'vssyl-shared';
import { getAIExecutionRecord } from '../intelligence/executionRecordService';
import { getReplayContract } from '../intelligence/replayContract';

export async function buildReplayPreparationPreview(
  prisma: PrismaClient,
  request: AIReplayPreparationRequest
): Promise<AIReplayPreparationPreview | null> {
  const record = await getAIExecutionRecord(prisma, request.executionRecordId);
  if (!record) return null;

  const current = {
    provider: record.provider,
    model: record.model,
    promptPolicyVersion:
      typeof record.routingSummary?.promptPolicyVersion === 'string'
        ? record.routingSummary.promptPolicyVersion
        : undefined,
    userQuery: record.userQuery,
    surface: record.surface,
  };

  const proposed = {
    provider: request.providerOverride ?? record.provider,
    model: request.modelOverride ?? record.model,
    promptPolicyVersion:
      request.promptPolicyVersionOverride ?? current.promptPolicyVersion,
    mode: request.mode,
  };

  const differences: string[] = [];
  if (proposed.provider !== current.provider) {
    differences.push(`Provider: ${current.provider ?? 'none'} → ${proposed.provider ?? 'none'}`);
  }
  if (proposed.model !== current.model) {
    differences.push(`Model: ${current.model ?? 'none'} → ${proposed.model ?? 'none'}`);
  }
  if (proposed.promptPolicyVersion !== current.promptPolicyVersion) {
    differences.push(
      `Prompt policy: ${current.promptPolicyVersion ?? 'default'} → ${proposed.promptPolicyVersion ?? 'default'}`
    );
  }
  if (request.mode === 'IDENTICAL' && differences.length === 0) {
    differences.push('Identical replay — no configuration deltas');
  }

  const contract = getReplayContract();

  return {
    executionRecordId: request.executionRecordId,
    current,
    proposed,
    differences,
    canExecute: false,
    message: `${contract.description} Phase 4 prepares replay only; execution is blocked.`,
  };
}
