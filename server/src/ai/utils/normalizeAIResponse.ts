/**
 * Normalizes raw AI provider output into a consistent shape.
 * - If the model returns structured JSON (type, title, sections), we keep it and derive plain text for storage.
 * - If the model returns legacy { response, confidence, reasoning, actions }, we pass through and set structured to undefined.
 */

import {
  AI_RESPONSE_VERSION,
  StructuredAIResponse,
  StructuredAITableData,
  type AIEvidenceItem,
  type AIRecommendedAction,
  type AIResponseMode,
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
  if (structured.summary?.trim()) {
    parts.push(structured.summary.trim());
    parts.push('');
  }
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
  if (Array.isArray(structured.keyInsights) && structured.keyInsights.length) {
    parts.push('');
    parts.push('Key Insights');
    structured.keyInsights
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => parts.push(`- ${item}`));
  }
  if (Array.isArray(structured.assumptions) && structured.assumptions.length) {
    parts.push('');
    parts.push('Assumptions');
    structured.assumptions
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => parts.push(`- ${item}`));
  }
  if (Array.isArray(structured.risks) && structured.risks.length) {
    parts.push('');
    parts.push('Risks / Watchouts');
    structured.risks
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => parts.push(`- ${item}`));
  }
  if (Array.isArray(structured.recommendedActions) && structured.recommendedActions.length) {
    parts.push('');
    parts.push('Recommended Actions');
    structured.recommendedActions.forEach((action) => {
      const title = action.title?.trim();
      if (!title) return;
      parts.push(`- ${title}`);
      const description = action.description?.trim();
      if (description) {
        parts.push(`  ${description}`);
      }
    });
  }
  return parts.join('\n').trim() || 'No content';
}

function isStructuredAIResponse(value: unknown): value is StructuredAIResponse {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;

  const hasV2Shape = typeof o.mode === 'string' && typeof o.summary === 'string';
  if (hasV2Shape) return true;

  if (typeof o.type !== 'string') return false;
  if (o.type === 'table') {
    const t = o.table as Record<string, unknown> | undefined;
    return Boolean(
      t &&
      Array.isArray(t.columns) &&
      t.columns.every((c: unknown) => typeof c === 'string') &&
      Array.isArray(t.rows) &&
      t.rows.every(
        (r: unknown) =>
          Array.isArray(r) && (r as unknown[]).every((c: unknown) => typeof c === 'string')
      )
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Normalize parsed JSON from the model (or legacy provider shape) into NormalizedAIResponse.
 */
export function normalizeAIResponse(parsed: Record<string, unknown>): NormalizedAIResponse {
  const parsedRecord =
    parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const confidence =
    typeof parsedRecord.confidence === 'number'
      ? parsedRecord.confidence
      : typeof parsedRecord.confidence === 'string'
        ? parseFloat(parsedRecord.confidence) || 0.8
        : 0.8;
  const reasoning =
    typeof parsedRecord.reasoning === 'string' ? parsedRecord.reasoning : undefined;
  const actions = Array.isArray(parsedRecord.actions) ? parsedRecord.actions : undefined;

  if (isStructuredAIResponse(parsed)) {
    const allowedConfidenceLevels = new Set(['low', 'medium', 'high']);
    const allowedTones = new Set(['clear', 'professional', 'concise', 'operator', 'supportive']);
    const allowedFormats = new Set(['standard', 'executive_summary', 'step_by_step', 'diagnostic']);
    const type = (parsed.type as StructuredResponseType) || 'answer';
    const mode: AIResponseMode =
      typeof parsed.mode === 'string' &&
      ['answer', 'summary', 'analysis', 'recommendation', 'action_plan', 'comparison', 'status_update', 'error'].includes(parsed.mode)
        ? (parsed.mode as AIResponseMode)
        : type === 'summary' || type === 'answer'
          ? type
          : 'analysis';
    const sections = Array.isArray(parsed.sections)
      ? (parsed.sections as Array<{ heading?: string; title?: string; content: string; icon?: string }>).map((s) => ({
          heading: String(s.heading ?? s.title ?? '').trim(),
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
    const keyInsights = isStringArray(parsed.keyInsights) ? parsed.keyInsights : undefined;
    const assumptions = isStringArray(parsed.assumptions) ? parsed.assumptions : undefined;
    const risks = isStringArray(parsed.risks) ? parsed.risks : undefined;
    const evidence = Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter(
            (item): item is { label: string; sourceType?: unknown; sourceId?: unknown; detail?: unknown } =>
              !!item &&
              typeof item === 'object' &&
              typeof (item as { label?: unknown }).label === 'string' &&
              (item as { label: string }).label.trim().length > 0
          )
          .map((item): AIEvidenceItem => ({
            label: item.label.trim(),
            sourceType:
              typeof item.sourceType === 'string' &&
              ['module', 'file', 'chat', 'calendar', 'drive', 'business', 'personal', 'system', 'unknown'].includes(item.sourceType)
                ? item.sourceType as AIEvidenceItem['sourceType']
                : undefined,
            sourceId: typeof item.sourceId === 'string' ? item.sourceId : undefined,
            detail: typeof item.detail === 'string' ? item.detail : undefined,
          }))
      : undefined;
    const recommendedActions = Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions
          .filter(
            (item): item is { title: string; description?: unknown; priority?: unknown; actionType?: unknown; targetModule?: unknown } =>
              !!item &&
              typeof item === 'object' &&
              typeof (item as { title?: unknown }).title === 'string' &&
              (item as { title: string }).title.trim().length > 0
          )
          .map((item): AIRecommendedAction => ({
            title: item.title.trim(),
            description: typeof item.description === 'string' ? item.description : undefined,
            priority:
              typeof item.priority === 'string' && ['low', 'medium', 'high'].includes(item.priority)
                ? item.priority as AIRecommendedAction['priority']
                : undefined,
            actionType:
              typeof item.actionType === 'string' && ['manual', 'suggested', 'automated'].includes(item.actionType)
                ? item.actionType as AIRecommendedAction['actionType']
                : undefined,
            targetModule: typeof item.targetModule === 'string' ? item.targetModule : undefined,
          }))
      : undefined;
    const confidenceValue =
      parsed.confidence && typeof parsed.confidence === 'object'
        ? (parsed.confidence as Record<string, unknown>)
        : undefined;
    const confidenceStructured =
      confidenceValue &&
      typeof confidenceValue.level === 'string' &&
      allowedConfidenceLevels.has(confidenceValue.level)
        ? {
            level: confidenceValue.level as 'low' | 'medium' | 'high',
            explanation:
              typeof confidenceValue.explanation === 'string'
                ? confidenceValue.explanation
                : undefined,
          }
        : undefined;
    const styleValue =
      parsed.style && typeof parsed.style === 'object'
        ? (parsed.style as Record<string, unknown>)
        : undefined;
    const tone =
      styleValue && typeof styleValue.tone === 'string' && allowedTones.has(styleValue.tone)
        ? styleValue.tone as 'clear' | 'professional' | 'concise' | 'operator' | 'supportive'
        : undefined;
    const format =
      styleValue && typeof styleValue.format === 'string' && allowedFormats.has(styleValue.format)
        ? styleValue.format as 'standard' | 'executive_summary' | 'step_by_step' | 'diagnostic'
        : undefined;
    const style = tone || format ? { tone, format } : undefined;
    const structured: StructuredAIResponse = {
      mode,
      summary:
        typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : '',
      keyInsights,
      evidence,
      assumptions,
      risks,
      recommendedActions,
      confidence: confidenceStructured,
      style,
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
      metadata: { responseVersion: AI_RESPONSE_VERSION },
    };
    const response = plainTextFromStructured(structured);
    if (!structured.summary) {
      structured.summary = response.slice(0, 240) || 'No content';
    }
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
    typeof parsedRecord.response === 'string'
      ? parsedRecord.response.trim()
      : typeof parsedRecord.message === 'string'
        ? parsedRecord.message.trim()
        : '';
  return {
    response: response || 'No response generated.',
    confidence,
    reasoning,
    actions: actions as Array<Record<string, unknown>> | undefined,
  };
}
