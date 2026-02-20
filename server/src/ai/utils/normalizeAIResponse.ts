/**
 * Normalizes raw AI provider output into a consistent shape.
 * - If the model returns structured JSON (type, title, sections), we keep it and derive plain text for storage.
 * - If the model returns legacy { response, confidence, reasoning, actions }, we pass through and set structured to undefined.
 */

import {
  StructuredAIResponse,
  StructuredAITableData,
  isStructuredAIResponse,
  type StructuredResponseType,
} from '../types/structuredResponse';

/**
 * Extract JSON from markdown code blocks (```json ... ```) or return the string as-is.
 * Handles cases where AI returns JSON wrapped in code blocks, even with surrounding text.
 */
export function extractJSONFromMarkdown(text: string): string {
  const trimmed = text.trim();
  // Match ```json ... ``` or ``` ... ``` anywhere in the text (with optional json language tag)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const extracted = codeBlockMatch[1].trim();
    // If it looks like JSON (starts with { or [), return it
    if (extracted.startsWith('{') || extracted.startsWith('[')) {
      return extracted;
    }
  }
  // Also handle inline code blocks with JSON
  const inlineMatch = trimmed.match(/`([\s\S]*?)`/);
  if (inlineMatch && inlineMatch[1]) {
    const inner = inlineMatch[1].trim();
    // If it looks like JSON (starts with { or [), return it
    if (inner.startsWith('{') || inner.startsWith('[')) {
      return inner;
    }
  }
  // If the whole text looks like JSON (starts with { or [), return it as-is
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }
  return trimmed;
}

export interface NormalizedAIResponse {
  /** Plain text for DB storage and fallback display (always set) */
  response: string;
  confidence: number;
  reasoning?: string;
  /** Legacy action objects from provider (schedule, communicate, etc.) */
  actions?: Array<Record<string, unknown>>;
  /** When present, frontend should use AIResponseRenderer */
  structured?: StructuredAIResponse;
}

/**
 * Build a single plain-text string from structured sections or table (for DB and fallback).
 */
function plainTextFromStructured(structured: StructuredAIResponse): string {
  const parts: string[] = [];
  if (structured.title?.trim()) {
    parts.push(structured.title.trim());
    parts.push('');
  }
  if (structured.type === 'table' && structured.table?.columns?.length && structured.table?.rows?.length) {
    parts.push(structured.table.columns.join(' | '));
    structured.table.rows.forEach((row) => parts.push(row.map((c) => String(c ?? '')).join(' | ')));
    parts.push('');
  }
  for (const s of structured.sections || []) {
    const h = (s.heading || '').trim();
    const c = (s.content || '').trim();
    if (h) parts.push(`${h}\n${c}`);
    else if (c) parts.push(c);
    parts.push('');
  }
  if (structured.actions?.length) {
    parts.push(
      structured.actions.map((a) => a.label).filter(Boolean).join(' · ')
    );
  }
  return parts.join('\n').trim() || 'No content';
}

/**
 * Normalize parsed JSON from the model (or legacy provider shape) into NormalizedAIResponse.
 */
export function normalizeAIResponse(parsed: Record<string, unknown>): NormalizedAIResponse {
  const confidence =
    typeof parsed.confidence === 'number'
      ? parsed.confidence
      : typeof parsed.confidence === 'string'
        ? parseFloat(parsed.confidence) || 0.8
        : 0.8;
  const reasoning =
    typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined;
  const actions = Array.isArray(parsed.actions) ? parsed.actions : undefined;

  if (isStructuredAIResponse(parsed)) {
    const type = (parsed.type as StructuredResponseType) || 'answer';
    const sections = Array.isArray(parsed.sections)
      ? (parsed.sections as Array<{ heading: string; content: string; icon?: string }>).map((s) => ({
          heading: String(s.heading ?? '').trim(),
          content: String(s.content ?? '').trim(),
          icon: typeof s.icon === 'string' && s.icon.trim() ? s.icon.trim() : undefined,
        }))
      : [];
    let table: StructuredAITableData | undefined = undefined;
    if (type === 'table' && parsed.table && typeof parsed.table === 'object') {
      const t = parsed.table as unknown as Record<string, unknown>;
      const cols = Array.isArray(t.columns) ? (t.columns as unknown[]).map((c) => String(c ?? '')) : [];
      const rawRows = Array.isArray(t.rows) ? (t.rows as unknown[]).map((r) => (Array.isArray(r) ? (r as unknown[]).map((c) => String(c ?? '')) : [])) : [];
      const colCount = cols.length;
      const rows = colCount
        ? rawRows.map((row) =>
            Array.from({ length: colCount }, (_, i) => String(row[i] ?? '').trim())
          )
        : [];
      table = colCount ? { columns: cols, rows } : undefined;
    }
    const structured: StructuredAIResponse = {
      type,
      title:
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim()
          : undefined,
      sections,
      ...(table !== undefined && { table: table as StructuredAIResponse['table'] }),
      actions: Array.isArray(parsed.actions)
        ? (parsed.actions as Array<{ label: string; action?: string; fileId?: string; href?: string }>).map(
            (a) => ({
              label: String(a.label ?? '').trim(),
              action: typeof a.action === 'string' ? a.action : undefined,
              fileId: typeof a.fileId === 'string' ? a.fileId : undefined,
              href: typeof a.href === 'string' ? a.href : undefined,
            })
          )
        : undefined,
    };
    const response = plainTextFromStructured(structured);
    return {
      response,
      confidence,
      reasoning,
      actions: actions as Array<Record<string, unknown>> | undefined,
      structured,
    };
  }

  // Legacy: single string response
  const response =
    typeof parsed.response === 'string'
      ? parsed.response.trim()
      : typeof parsed.message === 'string'
        ? parsed.message.trim()
        : '';
  return {
    response: response || 'No response generated.',
    confidence,
    reasoning,
    actions: actions as Array<Record<string, unknown>> | undefined,
  };
}
