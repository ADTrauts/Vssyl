import OpenAI from 'openai';
import { logger } from '../../lib/logger';
import { AIQueryService } from '../aiQueryService';

export type NotebookAICompletionOutcome =
  | { success: true; text: string }
  | { success: false; error: string };

function parseJsonFromText<T>(text: string): T | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function runNotebookAICompletion(params: {
  userId: string;
  businessId?: string | null;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}): Promise<NotebookAICompletionOutcome> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'AI is not configured (missing OPENAI_API_KEY)' };
  }

  const availability = await AIQueryService.checkQueryAvailability(
    params.userId,
    params.businessId ?? null
  );
  if (!availability.available && !availability.isUnlimited) {
    return { success: false, error: 'No AI queries remaining' };
  }

  const client = new OpenAI({ apiKey, timeout: 90000, maxRetries: 1 });
  const model = process.env.NOTEBOOK_AI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 2500,
      ...(params.jsonMode
        ? { response_format: { type: 'json_object' as const } }
        : {}),
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return { success: false, error: 'Empty AI response' };
    }

    if (!availability.isUnlimited) {
      await AIQueryService.consumeQuery(params.userId, params.businessId ?? null, 1);
    }

    return { success: true, text };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Notebook AI completion failed', {
      operation: 'notebook_ai_completion',
      error: { message: err.message, stack: err.stack },
    });
    return { success: false, error: err.message || 'AI request failed' };
  }
}

export function parseNotebookAIJson<T>(text: string): T | null {
  return parseJsonFromText<T>(text);
}
