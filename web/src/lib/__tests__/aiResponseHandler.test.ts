import { describe, expect, it } from 'vitest';
import {
  buildAIConversationItemFromTwinData,
  isStructuredAIResponseObject,
  normalizeStoredAIMessage,
  normalizeTwinResponseData,
  tryParseStructuredAIJSON,
} from '../aiResponseHandler';

const CONVERSATION_JSON = JSON.stringify({
  mode: 'conversation',
  summary: 'It sounds like you could really use a break to recharge!',
  confidence: { level: 'high' },
  metadata: { responseVersion: 'v2' },
});

describe('tryParseStructuredAIJSON', () => {
  it('parses raw structured conversation JSON string', () => {
    const parsed = tryParseStructuredAIJSON(CONVERSATION_JSON);
    expect(parsed?.mode).toBe('conversation');
    expect(parsed?.summary).toContain('break to recharge');
  });

  it('does not parse arbitrary JSON objects', () => {
    expect(tryParseStructuredAIJSON('{"foo": 1, "bar": 2}')).toBeNull();
    expect(tryParseStructuredAIJSON('{"name": "test"}')).toBeNull();
  });

  it('parses fenced structured JSON', () => {
    const fenced = '```json\n' + CONVERSATION_JSON + '\n```';
    const parsed = tryParseStructuredAIJSON(fenced);
    expect(parsed?.summary).toContain('break to recharge');
  });
});

describe('normalizeTwinResponseData', () => {
  it('extracts summary when response is raw JSON string', () => {
    const out = normalizeTwinResponseData({ response: CONVERSATION_JSON, confidence: 0.9 });
    expect(out.response).toBe('It sounds like you could really use a break to recharge!');
    expect(out.structured?.mode).toBe('conversation');
    expect(out.response).not.toContain('"mode"');
  });

  it('keeps structured object and prose when both provided correctly', () => {
    const structured = {
      mode: 'conversation' as const,
      summary: 'Hello there.',
      metadata: { responseVersion: 'v2' },
    };
    const out = normalizeTwinResponseData({
      response: 'Hello there.',
      structured,
    });
    expect(out.response).toBe('Hello there.');
    expect(out.structured?.summary).toBe('Hello there.');
  });

  it('accepts direct structured object at top level', () => {
    const direct = {
      mode: 'conversation',
      summary: 'Direct structured payload.',
      metadata: { responseVersion: 'v2' },
    };
    expect(isStructuredAIResponseObject(direct)).toBe(true);
    const out = normalizeTwinResponseData(direct as Parameters<typeof normalizeTwinResponseData>[0]);
    expect(out.response).toBe('Direct structured payload.');
    expect(out.structured?.mode).toBe('conversation');
  });

  it('leaves normal markdown prose unchanged', () => {
    const prose = 'Here are a few ideas:\n\n- Savannah\n- Charleston';
    const out = normalizeTwinResponseData({ response: prose });
    expect(out.response).toBe(prose);
    expect(out.structured).toBeUndefined();
  });
});

describe('buildAIConversationItemFromTwinData', () => {
  it('builds item with structured for JSON response string', () => {
    const item = buildAIConversationItemFromTwinData({ response: CONVERSATION_JSON });
    expect(item.content).toContain('break to recharge');
    expect(item.structured?.mode).toBe('conversation');
    expect(item.content).not.toMatch(/^\s*\{/);
  });
});

describe('normalizeStoredAIMessage', () => {
  it('fixes legacy DB rows where content is JSON but structured metadata exists', () => {
    const structured = {
      mode: 'conversation',
      summary: 'Stored summary prose.',
      metadata: { responseVersion: 'v2' },
    };
    const out = normalizeStoredAIMessage({
      content: CONVERSATION_JSON,
      structured,
    });
    expect(out.content).toBe('Stored summary prose.');
    expect(out.structured?.mode).toBe('conversation');
  });
});
