import { describe, expect, it } from 'vitest';
import {
  consumeTwinSseLine,
  createTwinStreamState,
  extractPartialSummaryFromStream,
  finalizeTwinStream,
  looksLikeStructuredStreamStart,
  processTwinStreamChunk,
  shouldHideStreamingContent,
} from '../aiStreamHandler';

const CONVERSATION_JSON =
  '{"mode":"conversation","summary":"It sounds like you could really use a break!","confidence":{"level":"high"},"metadata":{"responseVersion":"v2"}}';

describe('aiStreamHandler', () => {
  it('detects structured stream start immediately on {', () => {
    expect(looksLikeStructuredStreamStart('{')).toBe(true);
    expect(looksLikeStructuredStreamStart('Hello')).toBe(false);
  });

  it('buffers chunks without display text for structured JSON', () => {
    let state = createTwinStreamState();
    const parts = ['{', '"mode":', '"conversation",', '"summary":', '"Hello there"'];
    let lastDisplay: string | null = 'initial';
    for (const p of parts) {
      const r = processTwinStreamChunk(state, p);
      state = r.state;
      lastDisplay = r.displayText;
    }
    expect(state.bufferingStructured).toBe(true);
    expect(lastDisplay).toBeNull();
  });

  it('allows plain prose streaming when not JSON', () => {
    let state = createTwinStreamState();
    const r = processTwinStreamChunk(state, 'Here is a ');
    expect(r.state.bufferingStructured).toBe(false);
    expect(r.displayText).toBe('Here is a ');
  });

  it('extracts partial summary from incomplete JSON', () => {
    const partial = extractPartialSummaryFromStream(
      '{"mode":"conversation","summary":"It sounds like you'
    );
    expect(partial).toContain('It sounds like you');
  });

  it('finalizeTwinStream uses fullData when provided', () => {
    const state = createTwinStreamState();
    const out = finalizeTwinStream({
      state,
      fullData: {
        response: CONVERSATION_JSON,
        structured: {
          mode: 'conversation',
          summary: 'Final summary.',
          metadata: { responseVersion: 'v2' },
        },
      },
    });
    expect(out.response).toBe('Final summary.');
    expect(out.structured?.mode).toBe('conversation');
  });

  it('finalizeTwinStream parses accumulated JSON when no fullData', () => {
    const state = {
      accumulated: CONVERSATION_JSON,
      bufferingStructured: true,
      summaryPreview: '',
    };
    const out = finalizeTwinStream({ state });
    expect(out.response).toContain('break');
    expect(out.structured?.mode).toBe('conversation');
  });

  it('consumeTwinSseLine returns fullData on done', () => {
    let state = createTwinStreamState();
    state = processTwinStreamChunk(state, '{').state;
    const done = consumeTwinSseLine(
      state,
      `data: ${JSON.stringify({
        done: true,
        data: {
          response: 'Done summary.',
          structured: { mode: 'conversation', summary: 'Done summary.', metadata: { responseVersion: 'v2' } },
        },
      })}`
    );
    expect(done.fullData?.response).toBe('Done summary.');
  });

  it('shouldHideStreamingContent for raw JSON', () => {
    expect(shouldHideStreamingContent(CONVERSATION_JSON)).toBe(true);
    expect(shouldHideStreamingContent('Natural prose answer.')).toBe(false);
  });
});
