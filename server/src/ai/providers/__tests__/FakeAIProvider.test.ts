import { afterEach, describe, expect, it } from 'vitest';
import { setAIProviderFactory, resolveAIProvider } from '../aiProviderFactory';
import { FakeAIProvider, createFakeProviderFactory } from '../FakeAIProvider';
import type { AIRequest, UserContext } from '../../core/DigitalLifeTwinService';

const baseRequest: AIRequest = {
  id: 'r1',
  userId: 'u1',
  query: 'hello',
  context: {},
  timestamp: new Date(),
  priority: 'medium',
};

const emptyCtx = { userId: 'u1' } as UserContext;

describe('FakeAIProvider + factory (Phase 1)', () => {
  afterEach(() => {
    setAIProviderFactory(null);
  });

  it('returns text without network', async () => {
    const fake = new FakeAIProvider('openai', { type: 'text', response: 'Hello twin' });
    setAIProviderFactory(() => fake);
    const provider = await resolveAIProvider('openai');
    const res = await provider.process(baseRequest, emptyCtx, { userQuery: 'hello' });
    expect(res.response).toBe('Hello twin');
    expect(fake.callCount).toBe(1);
  });

  it('emulates RATE_LIMITED then success via queue', async () => {
    const fake = new FakeAIProvider('openai', [
      { type: 'error', code: 'RATE_LIMITED' },
      { type: 'text', response: 'recovered' },
    ]);
    setAIProviderFactory(createFakeProviderFactory({ openai: fake }));
    const p = await resolveAIProvider('openai');
    const first = await p.process(baseRequest, emptyCtx, {});
    expect(first.metadata?.code).toBe('RATE_LIMITED');
    const second = await p.process(baseRequest, emptyCtx, {});
    expect(second.response).toBe('recovered');
  });

  it('records vision presence for contract assertions', async () => {
    const fake = new FakeAIProvider('anthropic', { type: 'text', response: 'saw image' });
    setAIProviderFactory(() => fake);
    const p = await resolveAIProvider('anthropic');
    await p.process(baseRequest, emptyCtx, {
      visionImageParts: [{ mimeType: 'image/png', dataBase64: 'abc', fileName: 'a.png' }],
    });
    expect(fake.calls[0].hasVision).toBe(true);
  });

  it('supports tool_calls behavior', async () => {
    const fake = new FakeAIProvider('openai', {
      type: 'tool_calls',
      toolCalls: [{ id: 'tc1', name: 'list_drive_files', arguments: {} }],
    });
    setAIProviderFactory(() => fake);
    const p = await resolveAIProvider('openai');
    const res = await p.process(baseRequest, emptyCtx, {});
    const calls = (res.metadata as { toolCalls: unknown[] }).toolCalls;
    expect(calls).toHaveLength(1);
  });
});
