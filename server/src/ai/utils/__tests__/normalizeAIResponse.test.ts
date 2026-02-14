import { describe, it, expect } from 'vitest';
import { normalizeAIResponse } from '../normalizeAIResponse';

describe('normalizeAIResponse', () => {
  it('returns legacy shape when given legacy response', () => {
    const parsed = {
      response: 'Hello world',
      confidence: 0.9,
      reasoning: 'Because.',
      actions: [],
    };
    const out = normalizeAIResponse(parsed);
    expect(out.response).toBe('Hello world');
    expect(out.confidence).toBe(0.9);
    expect(out.reasoning).toBe('Because.');
    expect(out.structured).toBeUndefined();
  });

  it('uses message as response when response is missing (legacy)', () => {
    const out = normalizeAIResponse({ message: 'Fallback', confidence: 0.8 });
    expect(out.response).toBe('Fallback');
    expect(out.structured).toBeUndefined();
  });

  it('normalizes structured response with type, title, sections', () => {
    const parsed = {
      type: 'summary',
      title: 'Summary',
      sections: [
        { heading: 'A', content: 'Content A' },
        { heading: 'B', content: 'Content B' },
      ],
      confidence: 0.85,
    };
    const out = normalizeAIResponse(parsed);
    expect(out.structured).toBeDefined();
    expect(out.structured?.type).toBe('summary');
    expect(out.structured?.title).toBe('Summary');
    expect(out.structured?.sections).toHaveLength(2);
    expect(out.structured?.sections?.[0]).toEqual({ heading: 'A', content: 'Content A' });
    expect(out.response).toContain('Summary');
    expect(out.response).toContain('Content A');
  });

  it('includes optional section icon in structured sections', () => {
    const parsed = {
      type: 'answer',
      sections: [{ heading: 'Tip', content: 'Do this.', icon: '💡' }],
      confidence: 0.9,
    };
    const out = normalizeAIResponse(parsed);
    expect(out.structured?.sections?.[0].icon).toBe('💡');
  });

  it('normalizes table type with columns and rows', () => {
    const parsed = {
      type: 'table',
      title: 'Results',
      table: {
        columns: ['Name', 'Score'],
        rows: [
          ['Alice', '100'],
          ['Bob', '95'],
        ],
      },
      sections: [],
      confidence: 0.9,
    };
    const out = normalizeAIResponse(parsed);
    expect(out.structured?.type).toBe('table');
    expect(out.structured?.table).toEqual({
      columns: ['Name', 'Score'],
      rows: [
        ['Alice', '100'],
        ['Bob', '95'],
      ],
    });
    expect(out.response).toContain('Name');
    expect(out.response).toContain('Alice');
  });

  it('pads table rows to column count when row has fewer cells', () => {
    const parsed = {
      type: 'table',
      table: {
        columns: ['A', 'B', 'C'],
        rows: [['x', 'y'], ['a']],
      },
      sections: [],
      confidence: 0.8,
    };
    const out = normalizeAIResponse(parsed);
    expect(out.structured?.table?.rows[0]).toEqual(['x', 'y', '']);
    expect(out.structured?.table?.rows[1]).toEqual(['a', '', '']);
  });

  it('trims table rows to column count when row has extra cells', () => {
    const parsed = {
      type: 'table',
      table: {
        columns: ['A', 'B'],
        rows: [['1', '2', '3', '4']],
      },
      sections: [],
      confidence: 0.8,
    };
    const out = normalizeAIResponse(parsed);
    expect(out.structured?.table?.rows[0]).toEqual(['1', '2']);
  });

  it('defaults confidence when missing or invalid', () => {
    expect(normalizeAIResponse({ response: 'Hi' }).confidence).toBe(0.8);
    expect(normalizeAIResponse({ response: 'Hi', confidence: '0.75' }).confidence).toBe(0.75);
  });
});
