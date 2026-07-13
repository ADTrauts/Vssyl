/**
 * Provider process interface + factory for DigitalLifeTwinCore (Phase 1 test seam).
 */

import type { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';

export type AIProviderId = 'openai' | 'anthropic' | 'local';

export interface AIProviderProcess {
  process(
    request: AIRequest,
    context: UserContext,
    data?: Record<string, unknown>
  ): Promise<AIResponse>;
}

export type AIProviderFactory = (provider: AIProviderId) => AIProviderProcess | Promise<AIProviderProcess>;

let overrideFactory: AIProviderFactory | null = null;

/** Test-only / DI: replace provider construction. Pass null to clear. */
export function setAIProviderFactory(factory: AIProviderFactory | null): void {
  overrideFactory = factory;
}

export function getAIProviderFactoryOverride(): AIProviderFactory | null {
  return overrideFactory;
}

export async function resolveAIProvider(provider: string): Promise<AIProviderProcess> {
  const id = (provider === 'openai' || provider === 'anthropic' || provider === 'local'
    ? provider
    : 'local') as AIProviderId;

  if (overrideFactory) {
    return overrideFactory(id);
  }

  if (id === 'openai') {
    const { OpenAIProvider } = await import('../providers/OpenAIProvider');
    return new OpenAIProvider();
  }
  if (id === 'anthropic') {
    const { AnthropicProvider } = await import('../providers/AnthropicProvider');
    return new AnthropicProvider();
  }
  const { LocalProvider } = await import('../providers/LocalProvider');
  return new LocalProvider();
}
