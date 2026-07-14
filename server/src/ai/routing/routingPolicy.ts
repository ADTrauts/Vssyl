/**
 * Phase 7 — Business / user routing policy knobs (inactive by default).
 */
import type {
  AIBusinessRoutingPolicyMode,
  AIUserRoutingPreference,
} from 'vssyl-shared';

/** Future business policies — remain inactive unless explicitly set. */
export function resolveActiveBusinessPolicy(
  requested?: AIBusinessRoutingPolicyMode
): AIBusinessRoutingPolicyMode {
  if (!requested || requested === 'INACTIVE') return 'INACTIVE';
  // Phase 7: policies exist as modeled inputs but do not alter production.
  // Shadow router may reflect them when explicitly passed in tests.
  return requested;
}

export function resolveActiveUserPreference(
  requested?: AIUserRoutingPreference
): AIUserRoutingPreference {
  return requested ?? 'NONE';
}

export const FALLBACK_CHAIN_DOCUMENTATION = `
DEEP → anthropic.claude-3-5-sonnet → openai.gpt-4o → local.default
BALANCED → openai.gpt-4o / anthropic.claude-3-5-sonnet → peer cloud → local.default (sensitive only)
FAST → openai.gpt-4o-mini / anthropic.claude-3-haiku → BALANCED
SPECIALIZED → modality-specific catalog entries only
LOCAL_OR_PRIVATE → local.default only (no external)
`.trim();
