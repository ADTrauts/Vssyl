/**
 * AI Control Center feature gates — dormant capabilities stay off until operational.
 */
export function isAIActionsUIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ACTIONS_UI === 'true';
}

export function isContextDensityDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_CONTEXT_DENSITY_DEBUG === 'true';
}
