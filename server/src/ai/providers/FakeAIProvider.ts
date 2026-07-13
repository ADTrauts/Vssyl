/**
 * Deterministic fake AI providers for Phase 1 regression tests.
 * Never makes network calls.
 */

import type { AIRequest, AIResponse, UserContext } from '../core/DigitalLifeTwinService';
import type { AIProviderId, AIProviderProcess } from './aiProviderFactory';

export type FakeProviderBehavior =
  | { type: 'text'; response: string; confidence?: number }
  | {
      type: 'tool_calls';
      response?: string;
      toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
    }
  | { type: 'error'; code: 'RATE_LIMITED' | 'TEMP_UNAVAILABLE' | 'TIMEOUT'; message?: string }
  | { type: 'malformed'; response: string };

export interface FakeProviderCallRecord {
  provider: AIProviderId;
  request: AIRequest;
  data: Record<string, unknown>;
  systemPrompt?: string;
  userPrompt?: string;
  tools?: unknown;
  hasVision: boolean;
}

function baseMeta(provider: AIProviderId, extra: Partial<AIResponse['metadata']> = {}): AIResponse['metadata'] {
  return {
    provider,
    model: `fake-${provider}`,
    tokens: 0,
    cost: 0,
    processingTime: 1,
    ...extra,
  };
}

export class FakeAIProvider implements AIProviderProcess {
  readonly calls: FakeProviderCallRecord[] = [];
  private queue: FakeProviderBehavior[];

  constructor(
    private readonly providerId: AIProviderId,
    behaviors: FakeProviderBehavior | FakeProviderBehavior[]
  ) {
    this.queue = Array.isArray(behaviors) ? [...behaviors] : [behaviors];
  }

  get callCount(): number {
    return this.calls.length;
  }

  enqueue(behavior: FakeProviderBehavior): void {
    this.queue.push(behavior);
  }

  async process(
    request: AIRequest,
    _context: UserContext,
    data?: Record<string, unknown>
  ): Promise<AIResponse> {
    const payload = data ?? {};
    const visionParts = payload.visionImageParts;
    const hasVision = Array.isArray(visionParts) && visionParts.length > 0;
    this.calls.push({
      provider: this.providerId,
      request,
      data: payload,
      systemPrompt: typeof payload.systemPrompt === 'string' ? payload.systemPrompt : undefined,
      userPrompt:
        typeof payload.userQuery === 'string'
          ? payload.userQuery
          : typeof request.query === 'string'
            ? request.query
            : undefined,
      tools: payload.tools,
      hasVision,
    });

    const behavior = this.queue.shift() ?? { type: 'text' as const, response: 'Fake default response' };

    if (behavior.type === 'error') {
      return {
        id: `fake_err_${Date.now()}`,
        requestId: request.id,
        response: behavior.message || behavior.code,
        confidence: 0,
        actions: [],
        reasoning: behavior.code,
        metadata: baseMeta(this.providerId, {
          error: behavior.code,
          code: behavior.code,
        }),
      };
    }

    if (behavior.type === 'tool_calls') {
      return {
        id: `fake_tool_${Date.now()}`,
        requestId: request.id,
        response: behavior.response ?? '',
        confidence: 0.9,
        actions: [],
        reasoning: 'fake tool calls',
        metadata: baseMeta(this.providerId, {
          toolCalls: behavior.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
          messagesSent: [
            { role: 'system', content: 'fake-system' },
            { role: 'user', content: request.query },
          ],
        }),
      };
    }

    return {
      id: `fake_ok_${Date.now()}`,
      requestId: request.id,
      response: behavior.response,
      confidence: behavior.type === 'text' ? behavior.confidence ?? 0.95 : 0.5,
      actions: [],
      reasoning: behavior.type === 'malformed' ? 'malformed fake provider' : 'fake provider',
      metadata: baseMeta(this.providerId, {
        specialization: behavior.type === 'malformed' ? 'malformed' : undefined,
      }),
    };
  }
}

export function createFakeProviderFactory(
  map: Partial<Record<AIProviderId, FakeAIProvider | FakeProviderBehavior | FakeProviderBehavior[]>>
): (provider: AIProviderId) => AIProviderProcess {
  const instances: Partial<Record<AIProviderId, FakeAIProvider>> = {};
  for (const key of Object.keys(map) as AIProviderId[]) {
    const val = map[key];
    if (!val) continue;
    instances[key] =
      val instanceof FakeAIProvider ? val : new FakeAIProvider(key, val);
  }
  return (provider: AIProviderId) => {
    const existing = instances[provider];
    if (existing) return existing;
    return new FakeAIProvider(provider, { type: 'text', response: `Unhandled fake ${provider}` });
  };
}
