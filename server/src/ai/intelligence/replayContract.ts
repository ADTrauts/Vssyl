/**
 * Phase 3 — Replay contract (design only; no executor).
 */
import type { AIExecutionReplayContract } from 'vssyl-shared';

export const AI_EXECUTION_REPLAY_CONTRACT: AIExecutionReplayContract = {
  version: 'phase3-v1',
  description:
    'Operator may request a sandboxed replay of an AIExecutionRecord with identical or overridden provider/prompt policy. Phase 3 defines the contract only.',
  requestShape: {
    executionRecordId: '<uuid>',
    mode: 'IDENTICAL',
    dryRun: true,
    respectGovernedExecution: true,
  },
  constraints: [
    'dryRun must always be true until a dedicated sandbox executor exists',
    'Mutating tools must still go through AIActionExecution / executeGovernedTool',
    'Replay must not write personal or business knowledge into global stores',
    'Replay must not bypass approval policy',
    'Identical mode should reuse linked prompt/context snapshots when available (pipeline diagnostic / history)',
    'Different provider/model modes must not change production routing tables',
  ],
  nonGoals: [
    'No CI harness in Phase 3',
    'No automatic production re-execution',
    'No second execution pipeline',
    'No ModelTier implementation',
  ],
};

export function getReplayContract(): AIExecutionReplayContract {
  return AI_EXECUTION_REPLAY_CONTRACT;
}
