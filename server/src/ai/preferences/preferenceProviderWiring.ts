import type { ResolvedEffectivePreferences } from './preferenceTypes';

/**
 * Attach resolved preferences to twin provider options (testable wiring helper).
 */
export function applyResolvedPreferencesToProviderOptions(
  options: Record<string, unknown>,
  effective: ResolvedEffectivePreferences
): void {
  options.personalityForProvider = effective.providerPayload.personality;
  options.autonomyBoundariesForProvider = effective.providerPayload.autonomyBoundaries;
  options.effectivePreferencesContextBlock = effective.contextBlock;
  options.resolvedEffectivePreferences = effective;
}

/**
 * Build UserContext fields for provider system prompts.
 */
export function buildProviderUserContextFromPreferences(
  effective: ResolvedEffectivePreferences
): { personality: Record<string, unknown>; autonomySettings: Record<string, unknown> } {
  return {
    personality: effective.providerPayload.personality,
    autonomySettings: effective.providerPayload.autonomyBoundaries,
  };
}
