/**
 * Structured AI response schema for product-grade rendering.
 * Used so the frontend can render sections, titles, and action buttons
 * instead of raw markdown/text.
 */

export type StructuredResponseType = 'summary' | 'answer' | 'list' | 'steps' | 'actionable' | 'table';

export interface StructuredAIResponseSection {
  heading: string;
  content: string;
  /** Optional: emoji or icon name for section (e.g. "📄", "check") */
  icon?: string;
}

/** Table data when type is "table": columns and rows of strings */
export interface StructuredAITableData {
  columns: string[];
  rows: string[][];
}

export interface StructuredAIActionButton {
  label: string;
  action?: string;
  fileId?: string;
  /** Optional route or intent for navigation */
  href?: string;
}

export interface StructuredAIResponse {
  type: StructuredResponseType;
  title?: string;
  sections: StructuredAIResponseSection[];
  actions?: StructuredAIActionButton[];
  /** When type is "table", columns and rows for tabular display */
  table?: StructuredAITableData;
}

/** Type guard: value has type and sections array (or table for type "table") */
export function isStructuredAIResponse(
  value: unknown
): value is StructuredAIResponse {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (typeof o.type !== 'string') return false;
  if (o.type === 'table') {
    const t = o.table as Record<string, unknown> | undefined;
    return Boolean(
      t &&
      Array.isArray(t.columns) &&
      t.columns.every((c: unknown) => typeof c === 'string') &&
      Array.isArray(t.rows) &&
      t.rows.every((r: unknown) => Array.isArray(r) && (r as unknown[]).every((c: unknown) => typeof c === 'string'))
    );
  }
  return Boolean(
    Array.isArray(o.sections) &&
    o.sections.every(
      (s: unknown) =>
        s &&
        typeof s === 'object' &&
        typeof (s as Record<string, unknown>).heading === 'string' &&
        typeof (s as Record<string, unknown>).content === 'string'
    )
  );
}
