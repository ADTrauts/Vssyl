/**
 * Client-side buffering for /api/ai/twin SSE streams.
 * Prevents raw structured JSON from flashing in chat bubbles during streaming.
 */

import type { StructuredAIResponse } from '../components/ai/AIResponseRenderer';
import {
  buildSafeStreamFallbackContent,
  isLikelyStructuredJSONStream,
  normalizeTwinResponseData,
  tryParseStructuredAIJSON,
  type TwinResponseData,
} from './aiResponseHandler';

export interface TwinStreamState {
  accumulated: string;
  /** True once we detect v2 structured JSON — hide all raw chunks from UI. */
  bufferingStructured: boolean;
  /** Best-effort partial summary extracted while buffering (safe to show). */
  summaryPreview: string;
}

export function createTwinStreamState(): TwinStreamState {
  return {
    accumulated: '',
    bufferingStructured: false,
    summaryPreview: '',
  };
}

/** Immediate signal that streamed content is structured JSON, not plain prose. */
export function looksLikeStructuredStreamStart(text: string): boolean {
  const t = text.trimStart();
  if (!t) return false;
  if (t.startsWith('```')) return true;
  if (t.startsWith('{') || t.startsWith('[')) return true;
  return false;
}

/**
 * Extract partial "summary" string value from incomplete JSON (for optional typewriter).
 */
export function extractPartialSummaryFromStream(raw: string): string | null {
  const match = raw.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (match?.[1] !== undefined) {
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }
  const open = raw.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (open?.[1] !== undefined && open[1].length > 0) {
    try {
      return JSON.parse(`"${open[1]}"`) as string;
    } catch {
      return open[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }
  return null;
}

export interface ProcessTwinStreamChunkResult {
  state: TwinStreamState;
  /** Safe text to show during stream (null = keep thinking indicator only). */
  displayText: string | null;
}

/**
 * Consume one streamed text delta; returns safe display text if any.
 */
export function processTwinStreamChunk(
  state: TwinStreamState,
  chunk: string
): ProcessTwinStreamChunkResult {
  if (!chunk) {
    return { state, displayText: null };
  }

  const accumulated = state.accumulated + chunk;
  let bufferingStructured = state.bufferingStructured;

  if (!bufferingStructured && looksLikeStructuredStreamStart(accumulated)) {
    bufferingStructured = true;
  }
  if (!bufferingStructured && isLikelyStructuredJSONStream(accumulated)) {
    bufferingStructured = true;
  }

  let summaryPreview = state.summaryPreview;
  if (bufferingStructured) {
    const partial = extractPartialSummaryFromStream(accumulated);
    if (partial) summaryPreview = partial;
    return {
      state: { accumulated, bufferingStructured, summaryPreview },
      displayText: null,
    };
  }

  return {
    state: { accumulated, bufferingStructured, summaryPreview },
    displayText: accumulated,
  };
}

export interface FinalizeTwinStreamInput {
  state: TwinStreamState;
  fullData?: TwinResponseData;
}

/**
 * Build the final assistant message payload after the stream completes.
 */
export function finalizeTwinStream(input: FinalizeTwinStreamInput): TwinResponseData {
  const { state, fullData } = input;

  if (fullData) {
    return normalizeTwinResponseData(fullData);
  }

  const raw = state.accumulated.trim();
  if (!raw) {
    return { response: "I couldn't generate a proper response.", confidence: 0.5 };
  }

  const parsed = tryParseStructuredAIJSON(raw);
  if (parsed) {
    return normalizeTwinResponseData({
      response: raw,
      structured: parsed,
      confidence: 0.5,
    });
  }

  return normalizeTwinResponseData({
    response: buildSafeStreamFallbackContent(raw),
    confidence: 0.5,
  });
}

export type TwinSsePayload = {
  text?: string;
  done?: boolean;
  data?: unknown;
  error?: boolean;
  message?: string;
};

export interface ConsumeTwinSseLineResult {
  state: TwinStreamState;
  displayText: string | null;
  fullData?: TwinResponseData;
  errorMessage?: string;
}

/**
 * Parse one SSE `data: {...}` line and update stream state.
 */
export function consumeTwinSseLine(
  state: TwinStreamState,
  line: string
): ConsumeTwinSseLineResult {
  if (!line.startsWith('data: ')) {
    return { state, displayText: null };
  }

  try {
    const payload = JSON.parse(line.slice(6)) as TwinSsePayload;
    if (payload.error && payload.message) {
      return { state, displayText: null, errorMessage: payload.message };
    }

    let nextState = state;
    let displayText: string | null = null;

    if (typeof payload.text === 'string') {
      const processed = processTwinStreamChunk(state, payload.text);
      nextState = processed.state;
      displayText = processed.displayText;
    }

    if (payload.done === true && payload.data) {
      const fullData = normalizeTwinResponseData(payload.data as TwinResponseData);
      return { state: nextState, displayText: null, fullData };
    }

    return { state: nextState, displayText };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return { state, displayText: null };
    }
    throw e;
  }
}

/** True if message content should not be rendered (still raw JSON). */
export function shouldHideStreamingContent(content: string): boolean {
  const t = (content || '').trim();
  if (!t) return false;
  return looksLikeStructuredStreamStart(t) || isLikelyStructuredJSONStream(t);
}

export function isStreamingPlaceholderId(id: string): boolean {
  return id.startsWith('ai_stream_');
}
