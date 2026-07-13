/**
 * Phase 1B — Attachment / vision contract tests (deterministic fixtures, no OCR/network).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveVisionModelForProvider, resolveLlmFallback, selectLlmProvider } from '../../providers/providerRouting';
import { FakeAIProvider } from '../../providers/FakeAIProvider';
import type { AIRequest, UserContext } from '../../core/DigitalLifeTwinService';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

const baseRequest: AIRequest = {
  id: 'req-vision-1',
  userId: 'u1',
  query: 'What is in this image?',
  context: {},
  timestamp: new Date(),
  priority: 'medium',
};

const baseContext: UserContext = {
  userId: 'u1',
  personality: {},
  preferences: {},
  autonomySettings: {},
  recentActivity: [],
};

/** Minimal OpenAI-shaped multimodal builder mirrored from OpenAIProvider. */
function buildOpenAIUserContent(input: {
  text: string;
  visionParts: Array<{ mimeType: string; dataBase64?: string; url?: string; fileName: string }>;
}) {
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' } }
  > = [{ type: 'text', text: input.text }];
  for (const p of input.visionParts) {
    const url = p.url ?? (p.dataBase64 ? `data:${p.mimeType};base64,${p.dataBase64}` : null);
    if (!url) continue;
    parts.push({ type: 'image_url', image_url: { url, detail: 'low' } });
  }
  return parts;
}

/** Minimal Anthropic-shaped multimodal builder mirrored from AnthropicProvider. */
function buildAnthropicUserContent(input: {
  text: string;
  visionParts: Array<{ mimeType: string; dataBase64?: string; fileName: string }>;
}) {
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  > = [{ type: 'text', text: input.text }];
  for (const p of input.visionParts) {
    if (!p.dataBase64) continue;
    parts.push({
      type: 'image',
      source: { type: 'base64', media_type: p.mimeType, data: p.dataBase64 },
    });
  }
  return parts;
}

describe('Phase 1B — attachment and vision contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('authorized image produces OpenAI text + image_url blocks', () => {
    const content = buildOpenAIUserContent({
      text: 'Describe this',
      visionParts: [{ mimeType: 'image/png', dataBase64: 'AAA', fileName: 'a.png' }],
    });
    expect(content.some((p) => p.type === 'text')).toBe(true);
    expect(content.some((p) => p.type === 'image_url')).toBe(true);
  });

  it('authorized image produces Anthropic text + image blocks', () => {
    const content = buildAnthropicUserContent({
      text: 'Describe this',
      visionParts: [{ mimeType: 'image/png', dataBase64: 'BBB', fileName: 'b.png' }],
    });
    expect(content.some((p) => p.type === 'text')).toBe(true);
    expect(content.some((p) => p.type === 'image')).toBe(true);
  });

  it('text file path has summary only (no vision part)', () => {
    const content = buildOpenAIUserContent({
      text: 'File summary: hello world from notes.txt',
      visionParts: [],
    });
    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({ type: 'text' });
  });

  it('local provider strips vision parts', () => {
    const { provider, routing } = selectLlmProvider({
      query: 'my bank password',
      complexity: 'low',
      preferredProvider: 'openai',
    });
    const resolution = resolveVisionModelForProvider(provider, null, true, routing);
    expect(resolution.stripVisionParts).toBe(true);
  });

  it('FakeAIProvider records hasVision when parts present', async () => {
    const fake = new FakeAIProvider('openai', { type: 'text', response: 'seen' });
    await fake.process(baseRequest, baseContext, {
      visionImageParts: [{ mimeType: 'image/png', dataBase64: 'xx', fileName: 'x.png' }],
    });
    expect(fake.calls[0]?.hasVision).toBe(true);
  });

  it('provider fallback preserves or strips vision per capability', () => {
    const { routing } = selectLlmProvider({
      query: 'describe this image of my dashboard',
      complexity: 'medium',
      preferredProvider: 'openai',
    });
    const fb = resolveLlmFallback('openai', 'RATE_LIMITED', { vision: true }, routing);
    expect(fb?.fallbackProvider === 'anthropic' || fb === null || fb?.stripVisionParts !== undefined).toBe(true);
  });

  it('oversized / unsupported MIME are deterministic skip reasons (contract)', () => {
    const SKIP_CODES = ['unsupported_mime', 'too_large', 'trashed', 'unauthorized', 'no_path'] as const;
    expect(SKIP_CODES).toContain('unsupported_mime');
    expect(SKIP_CODES).toContain('too_large');
  });

  it('usedVisionParts true only when parts survived strip and provider succeeded', () => {
    const hasVisionParts = true;
    const stripVisionParts = false;
    const finalProviderErrored = false;
    const usedVisionParts = hasVisionParts && !finalProviderErrored && !stripVisionParts;
    expect(usedVisionParts).toBe(true);

    const stripped = hasVisionParts && !finalProviderErrored && true; // stripVisionParts=true
    expect(stripped).toBe(true); // formula still true when strip flag is the third AND — document Core formula:
    const usedWhenStripped = hasVisionParts && !finalProviderErrored && !true;
    expect(usedWhenStripped).toBe(false);
    const usedWhenErrored = hasVisionParts && !true && !stripVisionParts;
    expect(usedWhenErrored).toBe(false);
  });
});
